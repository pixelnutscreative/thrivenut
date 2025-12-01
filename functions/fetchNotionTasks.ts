import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the Notion access token from the connector
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("notion");
    
    // The database ID from the user's Notion URL
    // 23bca547096e80839456d950ce843aad
    const body = await req.json().catch(() => ({}));
    const databaseId = body.database_id || "23bca547096e80839456d950ce843aad";
    
    // Query the Notion database
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 100,
        // You can add filters here later
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notion API error:', errorText);
      return Response.json({ 
        error: 'Failed to fetch from Notion', 
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Transform Notion results into a simpler format
    const tasks = data.results.map(page => {
      const props = page.properties;
      
      // Extract title - Notion titles are in a specific format
      // Try multiple approaches to find the title
      let title = 'Untitled';
      
      // First, try to find a property named "Name" or "Title" or "Task"
      const commonTitleNames = ['Name', 'name', 'Title', 'title', 'Task', 'task', 'Item', 'item'];
      for (const name of commonTitleNames) {
        if (props[name] && props[name].type === 'title' && props[name].title?.length > 0) {
          title = props[name].title.map(t => t.plain_text).join('');
          break;
        }
      }
      
      // Fallback: find any property of type 'title'
      if (title === 'Untitled') {
        const titleProp = Object.values(props).find(p => p.type === 'title');
        if (titleProp && titleProp.title && titleProp.title.length > 0) {
          title = titleProp.title.map(t => t.plain_text).join('');
        }
      }
      
      // Extract other common properties
      const extractProperty = (prop) => {
        if (!prop) return null;
        switch (prop.type) {
          case 'select': return prop.select?.name || null;
          case 'multi_select': return prop.multi_select?.map(s => s.name) || [];
          case 'status': return prop.status?.name || null;
          case 'date': return prop.date?.start || null;
          case 'checkbox': return prop.checkbox || false;
          case 'number': return prop.number;
          case 'rich_text': return prop.rich_text?.map(t => t.plain_text).join('') || '';
          case 'url': return prop.url;
          default: return null;
        }
      };
      
      // Build simplified properties object
      const simplifiedProps = {};
      for (const [key, value] of Object.entries(props)) {
        if (value.type !== 'title') {
          simplifiedProps[key] = extractProperty(value);
        }
      }
      
      // Handle category - could be string or array
      let category = simplifiedProps['Category'] || simplifiedProps['category'] || null;
      if (Array.isArray(category)) {
        category = category.join(', ');
      }
      
      // Handle priority - could be string or array
      let priority = simplifiedProps['Priority'] || simplifiedProps['priority'] || null;
      if (Array.isArray(priority)) {
        priority = priority[0] || null;
      }

      return {
        notion_id: page.id,
        title: title,
        status: simplifiedProps['Status'] || simplifiedProps['status'] || null,
        priority: priority,
        category: category,
        due_date: simplifiedProps['Due'] || simplifiedProps['Due Date'] || simplifiedProps['due_date'] || null,
        notion_url: page.url,
        properties: simplifiedProps,
        last_synced: new Date().toISOString()
      };
    });

    return Response.json({ 
      tasks,
      has_more: data.has_more,
      next_cursor: data.next_cursor
    });
    
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
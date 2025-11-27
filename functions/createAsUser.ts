import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin to use this function
    if (user.email?.toLowerCase() !== 'pixelnutscreative@gmail.com') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { entityName, data, targetEmail } = body;

    if (!entityName || !data || !targetEmail) {
      return Response.json({ error: 'Missing required fields: entityName, data, targetEmail' }, { status: 400 });
    }

    // Create the entity first, then update created_by separately
    const created = await base44.asServiceRole.entities[entityName].create(data);
    
    // Now update to set the created_by field
    const result = await base44.asServiceRole.entities[entityName].update(created.id, {
      created_by: targetEmail
    });

    return Response.json({ success: true, data: result, id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
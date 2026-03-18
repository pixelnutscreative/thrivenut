import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth check
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch Pixel Nuts public calendar
    const calendarUrl = 'https://pixelnutscreative.com/cal';
    
    // The URL might be an HTML page with an embedded calendar
    // We need to extract the actual calendar feed URL (likely .ics format)
    const response = await fetch(calendarUrl);
    const html = await response.text();
    
    // Try to find iCal feed URL in the HTML
    // Common patterns: webcal://, .ics links, Google Calendar embed
    let icsUrl = null;
    
    // Check for Google Calendar embed
    const googleCalMatch = html.match(/src="([^"]*calendar\/embed[^"]*)"/);
    if (googleCalMatch) {
      // Extract calendar ID from embed URL
      const embedUrl = googleCalMatch[1];
      const calIdMatch = embedUrl.match(/src=([^&]+)/);
      if (calIdMatch) {
        const calendarId = decodeURIComponent(calIdMatch[1]);
        icsUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
      }
    }
    
    // Check for direct .ics links
    if (!icsUrl) {
      const icsMatch = html.match(/(https?:\/\/[^\s"']+\.ics)/);
      if (icsMatch) {
        icsUrl = icsMatch[1];
      }
    }
    
    // Check for webcal links
    if (!icsUrl) {
      const webcalMatch = html.match(/webcal:\/\/([^\s"']+)/);
      if (webcalMatch) {
        icsUrl = `https://${webcalMatch[1]}`;
      }
    }
    
    if (!icsUrl) {
      return Response.json({ error: 'Could not find calendar feed URL', events: [] }, { status: 200 });
    }
    
    // Fetch the .ics file
    const icsResponse = await fetch(icsUrl);
    const icsText = await icsResponse.text();
    
    // Parse iCal format (basic parsing)
    const events = [];
    const eventBlocks = icsText.split('BEGIN:VEVENT');
    
    for (let i = 1; i < eventBlocks.length; i++) {
      const block = eventBlocks[i].split('END:VEVENT')[0];
      
      const getField = (fieldName) => {
        const regex = new RegExp(`${fieldName}[;:]([^\r\n]+)`);
        const match = block.match(regex);
        return match ? match[1].trim() : null;
      };
      
      const summary = getField('SUMMARY');
      const dtstart = getField('DTSTART');
      const description = getField('DESCRIPTION');
      const location = getField('LOCATION');
      
      if (summary && dtstart) {
        // Parse date (basic - handles YYYYMMDD and YYYYMMDDTHHMMSS formats)
        let startDate;
        if (dtstart.includes('T')) {
          // Date with time
          const year = dtstart.substr(0, 4);
          const month = dtstart.substr(4, 2);
          const day = dtstart.substr(6, 2);
          const hour = dtstart.substr(9, 2);
          const min = dtstart.substr(11, 2);
          startDate = `${year}-${month}-${day} ${hour}:${min}`;
        } else {
          // Date only
          const year = dtstart.substr(0, 4);
          const month = dtstart.substr(4, 2);
          const day = dtstart.substr(6, 2);
          startDate = `${year}-${month}-${day}`;
        }
        
        events.push({
          summary: summary.replace(/\\n/g, ' ').replace(/\\,/g, ','),
          start: startDate,
          description: description?.replace(/\\n/g, ' ').replace(/\\,/g, ',') || null,
          location: location?.replace(/\\n/g, ' ').replace(/\\,/g, ',') || null
        });
      }
    }
    
    // Filter to today and future events only
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.start.split(' ')[0]);
      return eventDate >= today;
    }).slice(0, 10); // Limit to 10 upcoming events
    
    return Response.json({ events: upcomingEvents });
  } catch (error) {
    console.error('Calendar Fetch Error:', error);
    return Response.json({ error: error.message, events: [] }, { status: 200 });
  }
});
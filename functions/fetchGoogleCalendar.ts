import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the access token from the Google Calendar connector
    let accessToken;
    try {
      accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
    } catch (e) {
      return Response.json({ 
        error: 'Google Calendar not connected', 
        needsAuth: true 
      }, { status: 401 });
    }

    if (!accessToken) {
      return Response.json({ 
        error: 'Google Calendar not connected', 
        needsAuth: true 
      }, { status: 401 });
    }

    // Get today's date range
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Fetch events from Google Calendar API
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` + 
      new URLSearchParams({
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '50'
      }),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error('Google Calendar API error:', errorText);
      return Response.json({ 
        error: 'Failed to fetch calendar events',
        details: errorText
      }, { status: 500 });
    }

    const calendarData = await calendarResponse.json();

    // Transform events to a simpler format
    const events = (calendarData.items || []).map(event => {
      const startTime = event.start?.dateTime || event.start?.date;
      const endTime = event.end?.dateTime || event.end?.date;
      
      // Parse time for display
      let displayTime = '';
      let sortTime = '00:00';
      if (event.start?.dateTime) {
        const date = new Date(event.start.dateTime);
        displayTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        sortTime = date.toTimeString().slice(0, 5);
      } else {
        displayTime = 'All day';
      }

      return {
        id: event.id,
        title: event.summary || 'Untitled Event',
        description: event.description || '',
        location: event.location || '',
        startTime,
        endTime,
        displayTime,
        sortTime,
        isAllDay: !event.start?.dateTime,
        htmlLink: event.htmlLink,
        colorId: event.colorId
      };
    });

    return Response.json({ 
      events,
      count: events.length 
    });

  } catch (error) {
    console.error('Error fetching Google Calendar:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
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

    // Get user's timezone from preferences
    const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email }, '-updated_date');
    const userTimezone = prefs[0]?.user_timezone || 'America/New_York';

    // Get today's date range in user's timezone
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // First, fetch calendar list
    const calendarListResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!calendarListResponse.ok) {
      const errorText = await calendarListResponse.text();
      console.error('Failed to fetch calendar list:', errorText);
      return Response.json({ 
        error: 'Failed to fetch calendar list',
        details: errorText
      }, { status: 500 });
    }

    const calendarList = await calendarListResponse.json();
    const calendars = calendarList.items || [];

    // Fetch events from all calendars in parallel
    const eventPromises = calendars.map(async (calendar) => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?` + 
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

        if (!response.ok) return { items: [], calendarName: calendar.summary, calendarColor: calendar.backgroundColor };
        
        const data = await response.json();
        return { 
          items: data.items || [], 
          calendarName: calendar.summary,
          calendarColor: calendar.backgroundColor 
        };
      } catch (e) {
        console.error(`Error fetching calendar ${calendar.summary}:`, e);
        return { items: [], calendarName: calendar.summary, calendarColor: calendar.backgroundColor };
      }
    });

    const allCalendarEvents = await Promise.all(eventPromises);
    
    // Combine all events from all calendars
    const allEvents = [];

    // Flatten and transform all events
    allCalendarEvents.forEach(calendarData => {
      calendarData.items.forEach(event => {
        allEvents.push({
          ...event,
          calendarName: calendarData.calendarName,
          calendarColor: calendarData.calendarColor
        });
      });
    });

    // Transform events to a simpler format
    const events = allEvents.map(event => {
      const startTime = event.start?.dateTime || event.start?.date;
      const endTime = event.end?.dateTime || event.end?.date;
      
      // Parse time for display in user's timezone
      let displayTime = '';
      let sortTime = '00:00';
      if (event.start?.dateTime) {
        const date = new Date(event.start.dateTime);
        displayTime = date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true,
          timeZone: userTimezone 
        });
        // Get sortTime in user's timezone
        const localTime = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false,
          timeZone: userTimezone 
        });
        sortTime = localTime;
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
        colorId: event.colorId,
        calendarName: event.calendarName || 'Primary',
        calendarColor: event.calendarColor || '#4285f4'
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
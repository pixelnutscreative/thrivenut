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

    // Get today's date range in user's timezone using Intl for native support without extra deps
    const now = new Date();
    
    // Get the YYYY-MM-DD components in the user's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    
    // Construct ISO strings for the user's midnight.
    // Since Google API takes ISO with offset, we can specify the exact time we want.
    // But constructing the ISO string with offset manually is tricky.
    // Instead, we can create a string "YYYY-MM-DDT00:00:00" and let the Date constructor parse it relative to the USER timezone if we could... but we can't easily.
    
    // Easier approach: Use the formatted date string to verify "today".
    // We will ask Google for a slightly wider range (UTC day) but filter events manually to ensure they fall within the user's local day.
    // Or we can try to approximate the offset.
    
    // Let's use date-fns-tz to be precise and solve the "Randy's Birthday" issue definitively.
    // We import dynamically to avoid cluttering the top if not used elsewhere.
    const { toZonedTime, fromZonedTime } = await import('npm:date-fns-tz@3.1.3');
    const { startOfDay: getStartOfDay, endOfDay: getEndOfDay } = await import('npm:date-fns@3.6.0');
    
    const zonedNow = toZonedTime(now, userTimezone);
    const localStart = getStartOfDay(zonedNow);
    const localEnd = getEndOfDay(zonedNow);
    
    const timeMin = fromZonedTime(localStart, userTimezone).toISOString();
    const timeMax = fromZonedTime(localEnd, userTimezone).toISOString();

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
            timeMin: timeMin,
            timeMax: timeMax,
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
    const seenEventIds = new Set();

    // Flatten and transform all events
    allCalendarEvents.forEach(calendarData => {
      calendarData.items.forEach(event => {
        // Skip cancelled events
        if (event.status === 'cancelled') return;
        
        // Skip duplicates based on ID
        if (seenEventIds.has(event.id)) return;
        
        seenEventIds.add(event.id);
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
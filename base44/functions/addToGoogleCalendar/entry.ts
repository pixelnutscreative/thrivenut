import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, description, start_time, end_time, location } = await req.json();

        // 1. Get Access Token for Google Calendar
        const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
        
        if (!accessToken) {
             return Response.json({ error: "Google Calendar not connected" }, { status: 400 });
        }

        // 2. Create Event in Primary Calendar
        const event = {
            summary: title,
            description: description,
            location: location,
            start: {
                dateTime: start_time, // ISO string
                timeZone: 'UTC' // Adjust if user timezone known
            },
            end: {
                dateTime: end_time || new Date(new Date(start_time).getTime() + 60*60*1000).toISOString(), // Default 1 hour
                timeZone: 'UTC'
            }
        };

        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Google Calendar API error: ${err}`);
        }

        const data = await response.json();

        return Response.json({ success: true, eventLink: data.htmlLink });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { url } = await req.json();
        if (!url) return Response.json({ error: 'URL required' }, { status: 400 });

        // Extract Google Sheet ID
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) return Response.json({ error: 'Invalid Google Sheets URL' }, { status: 400 });

        const sheetId = match[1];
        const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

        const response = await fetch(exportUrl);
        if (!response.ok) {
            return Response.json({ error: 'Failed to fetch sheet. Make sure the sheet is public (Anyone with the link can view).' }, { status: 400 });
        }

        const csv = await response.text();
        return Response.json({ csv });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
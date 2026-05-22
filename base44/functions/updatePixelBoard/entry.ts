import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await req.json();
        const { id, ...fields } = payload;

        if (!id) {
            return Response.json({ error: 'Missing record ID' }, { status: 400 });
        }

        const updatedRecord = await base44.entities.PixelBoard.update(id, fields);

        return Response.json({ success: true, record: updatedRecord });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
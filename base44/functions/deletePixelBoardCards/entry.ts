import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const { ids } = await req.json();
        if (!Array.isArray(ids)) {
             return Response.json({ error: 'ids must be an array' }, { status: 400 });
        }
        for(const id of ids) {
           await base44.entities.PixelBoard.delete(id);
        }
        return Response.json({ success: true, count: ids.length });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
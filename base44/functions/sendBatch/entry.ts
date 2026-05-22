import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 1. Query records in batch
        const items = await base44.entities.PixelBoard.filter({ in_batch: true, batch_ready: false });
        
        // 2. Update each record
        const ids = [];
        for (const item of items) {
            await base44.entities.PixelBoard.update(item.id, { 
                batch_ready: true, 
                status: "🔄 In Progress",
                in_batch: false // Clear the batch flag so they leave the send queue
            });
            ids.push(item.id);
        }

        // 3. Return summary
        return Response.json({ success: true, count: items.length, ids });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
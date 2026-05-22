import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        // Fetch all PixelBoard items to filter and delete
        // We might have more than 50, so we'll fetch a larger chunk or just do it in a loop
        // For simplicity, we'll fetch up to 1000 items
        const items = await base44.asServiceRole.entities.PixelBoard.filter({});

        let deletedCount = 0;

        for (const item of items) {
            if (item.status === 'Unanswered' || item.status === 'Waiting on Daisy') {
                await base44.asServiceRole.entities.PixelBoard.delete(item.id);
                deletedCount++;
            }
        }

        return Response.json({ message: 'Cleanup complete', deletedCount });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
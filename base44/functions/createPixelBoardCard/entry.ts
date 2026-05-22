import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This function might be called via API key or user auth,
        // but we'll try to get the user if available.
        const user = await base44.auth.me().catch(() => null);

        const body = await req.json();
        
        const { 
            title, 
            details, 
            status = '💬 New', 
            category = 'Other', 
            priority = 'Normal', 
            asked_by, 
            card_color = '#24C4D6', 
            page_location, 
            group_tag 
        } = body;

        if (!title) {
            return Response.json({ error: 'Title is required' }, { status: 400 });
        }

        const newCard = await base44.asServiceRole.entities.PixelBoard.create({
            title,
            details,
            status,
            category,
            priority,
            asked_by: asked_by || (user ? user.full_name : 'API'),
            card_color,
            custom_fields: {
                page_location,
                group_tag
            }
        });

        return Response.json({ success: true, card: newCard });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
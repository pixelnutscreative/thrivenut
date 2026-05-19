import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        let payload = {};
        if (req.method === 'POST') {
            try {
                const clonedReq = req.clone();
                const text = await clonedReq.text();
                if (text) payload = JSON.parse(text);
            } catch (e) {
                console.log("Error parsing body", e);
            }
        }

        const targetEmail = payload.email || user.email;

        const prefs = await base44.asServiceRole.entities.UserPreferences.filter({ user_email: targetEmail });
        if (prefs.length === 0) {
            return Response.json({ error: 'User preferences not found for this email' }, { status: 404 });
        }

        await base44.asServiceRole.entities.UserPreferences.update(prefs[0].id, {
            max_groups: 999,
            group_creation_type: 'agency'
        });

        return Response.json({ success: true, message: `Limits updated for ${targetEmail}` });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
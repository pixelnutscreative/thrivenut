import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const currentUser = await base44.auth.me();
        if (!currentUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        // Get all blank preferences
        const allPrefs = await base44.asServiceRole.entities.UserPreferences.list(undefined, 2000);
        const blankPrefs = allPrefs.filter(p => !p.user_email || p.user_email.trim() === '');
        
        const results = {
            fixed: [],
            skipped: []
        };

        for (const pref of blankPrefs) {
            // The created_by field is a built-in metadata field containing the email of the creator
            const creatorEmail = pref.created_by;
            
            if (creatorEmail && creatorEmail.includes('@')) {
                // If we have a valid creator email, let's use it to populate the missing user_email
                await base44.asServiceRole.entities.UserPreferences.update(pref.id, {
                    user_email: creatorEmail
                });
                
                results.fixed.push({
                    id: pref.id,
                    restored_email: creatorEmail
                });
            } else {
                results.skipped.push({
                    id: pref.id,
                    reason: "No valid created_by email found",
                    created_by: pref.created_by
                });
            }
        }

        return Response.json({
            message: "Heal operation complete",
            total_blank_found: blankPrefs.length,
            ...results
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
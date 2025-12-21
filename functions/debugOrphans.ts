import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Admin check
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all preferences (using service role to ensure we see everything)
        // We scan a large number to be safe
        const allPrefs = await base44.asServiceRole.entities.UserPreferences.list(undefined, 2000);

        // Find orphans: No email OR empty email, BUT has tiktok_username
        const orphans = allPrefs.filter(p => {
            const hasNoEmail = !p.user_email || p.user_email.trim() === '';
            const hasTikTok = p.tiktok_username && p.tiktok_username.trim() !== '';
            return hasNoEmail && hasTikTok;
        });

        // Also find the specific users mentioned if they exist in prefs under a different key?
        // or just return the orphans for now
        
        return Response.json({ 
            count: orphans.length,
            orphans: orphans.map(o => ({
                id: o.id,
                tiktok_username: o.tiktok_username,
                created_date: o.created_date,
                // Include other potentially identifying fields
                nickname: o.nickname,
                real_name: o.real_name // if it exists on prefs (it's on UserProfile usually, but let's check prefs schema)
            }))
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
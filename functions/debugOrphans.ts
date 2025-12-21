import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const currentUser = await base44.auth.me();
        if (!currentUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Check if the specific users exist in the Auth/User table
        const targetEmails = ['peabodylegume@gmail.com', 'cholemcj047@gmail.com'];
        const allAuthUsers = await base44.asServiceRole.entities.User.list(undefined, 2000);
        
        const foundAuthUsers = allAuthUsers.filter(u => targetEmails.includes(u.email));
        
        // 2. Check for their preferences
        const allPrefs = await base44.asServiceRole.entities.UserPreferences.list(undefined, 2000);
        const foundPrefs = allPrefs.filter(p => targetEmails.includes(p.user_email));

        // 3. Inspect the "blank" preferences (orphans) to see what data they DO have
        const blankPrefs = allPrefs.filter(p => !p.user_email || p.user_email.trim() === '');

        return Response.json({
            foundInAuth: foundAuthUsers.map(u => ({ id: u.id, email: u.email, name: u.full_name })),
            foundInPrefs: foundPrefs.map(p => ({ id: p.id, email: p.user_email })),
            blankPrefsCount: blankPrefs.length,
            blankPrefsSamples: blankPrefs.slice(0, 5) // Show first 5 to see what's in them
        });

    } catch (error) {
        return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
});
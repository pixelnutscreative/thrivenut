import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export default Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all contacts using service role to bypass RLS (Row Level Security)
        // This allows searching across all users' contacts to find existing creators
        const allContacts = await base44.asServiceRole.entities.TikTokContact.list(5000); // list(limit) - limit is first arg if no sort? 
        // SDK note: list(sort, limit) or list(limit). 
        // Original code was list('username', 5000).
        // Let's use list('username', 5000) to be safe/consistent.

        // Consolidate and sanitize on backend to reduce payload size
        const byUsername = {};
        
        for (const contact of allContacts) {
            const username = (contact.username || '').toLowerCase().replace('@', '').trim();
            if (!username) continue;
            
            // Only expose public/safe fields needed for search/identification
            const entry = {
                username: contact.username, 
                display_name: contact.display_name,
                phonetic: contact.phonetic,
                image_url: contact.image_url,
                nickname: contact.nickname,
                real_name: contact.real_name 
            };

            if (!byUsername[username]) {
                byUsername[username] = entry;
            } else {
                // Merge logic - prefer existing values if they are populated
                // This ensures we get the most complete profile available
                const existing = byUsername[username];
                if (!existing.display_name && entry.display_name) existing.display_name = entry.display_name;
                if (!existing.phonetic && entry.phonetic) existing.phonetic = entry.phonetic;
                if (!existing.image_url && entry.image_url) existing.image_url = entry.image_url;
                if (!existing.nickname && entry.nickname) existing.nickname = entry.nickname;
                if (!existing.real_name && entry.real_name) existing.real_name = entry.real_name;
            }
        }

        const consolidated = Object.values(byUsername).sort((a, b) => a.username.localeCompare(b.username));

        return Response.json({ contacts: consolidated });
    } catch (error) {
        console.error('Search master contacts error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
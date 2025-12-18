import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        // Get public resources
        const publicResources = await base44.entities.UserResource.filter({ visibility: 'public' });

        // Get user's groups
        const memberships = await base44.entities.CreatorGroupMember.filter({ user_email: user.email, status: 'active' });
        const groupIds = memberships.map(m => m.group_id);

        let groupResources = [];
        if (groupIds.length > 0) {
            for (const gid of groupIds) {
                const res = await base44.entities.UserResource.filter({ visibility: 'group', group_id: gid });
                groupResources = [...groupResources, ...res];
            }
        }

        // Combine and dedup
        const all = [...publicResources, ...groupResources];
        const unique = Array.from(new Map(all.map(item => [item.id, item])).values());

        // Sort by date desc
        unique.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

        return Response.json({ resources: unique });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
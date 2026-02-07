import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { groupId } = await req.json();

        if (!groupId) {
            return Response.json({ error: 'Group ID is required' }, { status: 400 });
        }

        // Use service role to fetch group regardless of RLS
        // This is necessary so we can show "This group is private" screen with the group name
        const groups = await base44.asServiceRole.entities.CreatorGroup.filter({ id: groupId });
        const group = groups[0];

        if (!group) {
            return Response.json({ group: null });
        }

        const { includeMembers } = await req.json();
        let members = [];
        
        if (includeMembers) {
            members = await base44.asServiceRole.entities.CreatorGroupMember.filter({ group_id: groupId });
        }

        return Response.json({ group, members });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
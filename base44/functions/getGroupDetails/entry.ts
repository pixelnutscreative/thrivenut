import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        let payload = {};
        if (req.method === 'POST') {
            try {
                // Some invocations might pass empty body or it might be consumed
                const clonedReq = req.clone();
                const text = await clonedReq.text();
                if (text) payload = JSON.parse(text);
            } catch (e) {
                console.log("Error parsing body", e);
            }
        }
        const url = new URL(req.url);
        const groupId = payload.groupId || url.searchParams.get('groupId');
        const includeMembers = payload.includeMembers || url.searchParams.get('includeMembers') === 'true';

        if (!groupId) {
            return Response.json({ error: 'Group ID is required' }, { status: 400 });
        }

        // Use service role to fetch group regardless of RLS
        const groups = await base44.asServiceRole.entities.CreatorGroup.filter({ id: groupId });
        const group = groups[0];

        if (!group) {
            return Response.json({ group: null });
        }
        
        let members = [];
        if (includeMembers) {
            members = await base44.asServiceRole.entities.CreatorGroupMember.filter({ group_id: groupId });
        }

        return Response.json({ group, members });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
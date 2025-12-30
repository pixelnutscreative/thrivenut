import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        // We use service role to bypass any ACLs
        const adminClient = base44.asServiceRole;

        const idsToDelete = [
            '69439f52627803b8bd44a353',
            '69439d7ce8f05f572d0971b3',
            '69439c5cc05c2ca7548c9ee3',
            '69439c4ac8306c6a6cfa08b8',
            '6943845204c7eb7d88a33fe0'
        ];

        const results = [];
        for (const id of idsToDelete) {
            try {
                await adminClient.entities.CreatorGroupMember.delete(id);
                results.push({ id, status: 'deleted' });
            } catch (e) {
                results.push({ id, status: 'error', error: e.message });
            }
        }

        return Response.json({ success: true, results });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
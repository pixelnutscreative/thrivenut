import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get user's agency memberships
        const memberships = await base44.entities.AgencyMember.filter({ 
            user_email: user.email, 
            status: 'active' 
        });
        const agencyIds = memberships.map(m => m.agency_id);

        // 2. Fetch Public Resources
        const publicResources = await base44.entities.UserResource.filter({ 
            visibility: 'public' 
        });

        // 3. Fetch Agency Resources (if user is in any agency)
        let agencyResources = [];
        if (agencyIds.length > 0) {
            // We have to filter one by one or fetch all agency resources and filter in code if SDK doesn't support 'in'
            // For now, let's fetch by agency_id if possible. 
            // If we can't do "in" query, we might need to loop. 
            // Base44 filter is simple equality usually. 
            // Let's loop through agency IDs (assuming user isn't in 100 agencies)
            for (const id of agencyIds) {
                const resources = await base44.entities.UserResource.filter({ 
                    visibility: 'agency', 
                    agency_id: id 
                });
                agencyResources = [...agencyResources, ...resources];
            }
        }

        // 4. Combine and Deduplicate
        const allResources = [...publicResources, ...agencyResources];
        // Dedupe by ID just in case
        const uniqueResources = Array.from(new Map(allResources.map(item => [item.id, item])).values());

        // 5. Add "shared_by" info (optional, requires fetching user profiles)
        // For speed, we return as is. The frontend can show "Shared" tag.

        return Response.json({ resources: uniqueResources });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
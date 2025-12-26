import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me(); // Just for logging

    // 1. Fetch ALL Groups
    const allGroups = await base44.asServiceRole.entities.CreatorGroup.filter({});
    
    const results = [];

    // 2. Iterate and Fix
    for (const group of allGroups) {
        if (!group.owner_email) continue;

        // Check for owner membership
        const memberships = await base44.asServiceRole.entities.CreatorGroupMember.filter({
            group_id: group.id,
            user_email: group.owner_email
        });

        let status = 'ok';
        let action = 'none';

        if (memberships.length === 0) {
            // Create missing owner
            await base44.asServiceRole.entities.CreatorGroupMember.create({
                group_id: group.id,
                user_email: group.owner_email,
                role: 'owner',
                level: 'Owner',
                status: 'active',
                joined_date: new Date().toISOString()
            });
            status = 'fixed_missing';
            action = 'created';
        } else {
            // Check if role is correct
            const m = memberships[0];
            if (m.role !== 'owner' || m.level !== 'Owner') {
                await base44.asServiceRole.entities.CreatorGroupMember.update(m.id, {
                    role: 'owner',
                    level: 'Owner',
                    status: 'active'
                });
                status = 'fixed_role';
                action = 'updated';
            }
        }

        results.push({
            group_id: group.id,
            group_name: group.name,
            owner: group.owner_email,
            status,
            action
        });
    }

    return Response.json({
      total_groups: allGroups.length,
      fixes: results.filter(r => r.status !== 'ok'),
      details: results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
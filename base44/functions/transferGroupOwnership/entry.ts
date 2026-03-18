import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { group_id, new_owner_email } = await req.json();

        if (!group_id || !new_owner_email) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const email = new_owner_email.toLowerCase().trim();

        // 1. Get the group
        const group = await base44.asServiceRole.entities.CreatorGroup.get(group_id);
        if (!group) {
            return Response.json({ error: 'Group not found' }, { status: 404 });
        }

        // 2. Verify current owner
        if (group.owner_email.toLowerCase() !== user.email.toLowerCase()) {
            return Response.json({ error: 'Only the current owner can transfer ownership' }, { status: 403 });
        }

        // 3. Update Group Owner
        await base44.asServiceRole.entities.CreatorGroup.update(group_id, {
            owner_email: email
        });

        // 4. Update/Create Member Record for New Owner
        // Check if new owner is already a member
        const existingMember = await base44.asServiceRole.entities.CreatorGroupMember.filter({
            group_id: group_id,
            user_email: email
        });

        if (existingMember.length > 0) {
            // Update role to admin if not already (owners should be admins)
            // Note: 'owner' role might not exist in enum, usually 'admin' is used for effective power
            await base44.asServiceRole.entities.CreatorGroupMember.update(existingMember[0].id, {
                role: 'admin',
                status: 'active'
            });
        } else {
            // Create new member record
            await base44.asServiceRole.entities.CreatorGroupMember.create({
                group_id: group_id,
                user_email: email,
                role: 'admin',
                status: 'active',
                level: 'Member', // Default level
                joined_at: new Date().toISOString()
            });
        }

        // 5. Ensure Old Owner is still an Admin (optional but good UX)
        // We don't delete them, just ensuring they have a member record so they don't lose access entirely
        const oldOwnerMember = await base44.asServiceRole.entities.CreatorGroupMember.filter({
            group_id: group_id,
            user_email: user.email
        });

        if (oldOwnerMember.length === 0) {
             await base44.asServiceRole.entities.CreatorGroupMember.create({
                group_id: group_id,
                user_email: user.email,
                role: 'admin',
                status: 'active',
                level: 'Member',
                joined_at: new Date().toISOString()
            });
        } else {
            // Make sure they are admin
             await base44.asServiceRole.entities.CreatorGroupMember.update(oldOwnerMember[0].id, {
                role: 'admin'
            });
        }

        return Response.json({ success: true });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
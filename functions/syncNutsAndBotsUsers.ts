import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        // Admin check (allow pixelnuts emails or admin role)
        if (user && user.role !== 'admin' && user.email !== 'pixelnutscreative@gmail.com') {
             return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Find the target group "The Nuts + Bots"
        let groups = await base44.asServiceRole.entities.CreatorGroup.filter({ name: "The Nuts + Bots" });
        if (groups.length === 0) {
            // Try searching all groups if exact match fails
            const allGroups = await base44.asServiceRole.entities.CreatorGroup.list(undefined, 1000);
            const target = allGroups.find(g => 
                (g.name.toLowerCase().includes("nuts") && g.name.toLowerCase().includes("bots")) ||
                g.name.toLowerCase() === "the nuts and bots"
            );
            if (target) groups = [target];
        }

        if (groups.length === 0) {
            return Response.json({ error: "Could not find group 'The Nuts + Bots'" }, { status: 404 });
        }
        const group = groups[0];
        console.log(`Found target group: ${group.name} (${group.id})`);

        // 2. Get all AI Platform Users with has_nuts_and_bots = true
        const allAiUsers = await base44.asServiceRole.entities.AIPlatformUser.list(undefined, 2000);
        const eligibleUsers = allAiUsers.filter(u => u.has_nuts_and_bots === true);
        console.log(`Found ${eligibleUsers.length} eligible Nuts + Bots users`);

        // 3. Sync them
        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let errors = [];

        // Fetch existing members
        const existingMembers = await base44.asServiceRole.entities.CreatorGroupMember.filter({ group_id: group.id }, undefined, 2000);
        const existingMemberMap = new Map();
        existingMembers.forEach(m => existingMemberMap.set(m.user_email.toLowerCase(), m));

        for (const aiUser of eligibleUsers) {
            const email = aiUser.user_email?.trim().toLowerCase();
            const name = aiUser.user_name || null;
            
            if (!email) continue;

            const existingMember = existingMemberMap.get(email);

            if (existingMember) {
                // Update name if missing or different
                if (name && (!existingMember.name || existingMember.name !== name)) {
                    try {
                        await base44.asServiceRole.entities.CreatorGroupMember.update(existingMember.id, { name: name });
                        updatedCount++;
                        console.log(`Updated name for ${email} to ${name}`);
                    } catch (err) {
                        console.error(`Failed to update ${email}: ${err.message}`);
                        errors.push({ email, action: 'update', error: err.message });
                    }
                } else {
                    skippedCount++;
                }
                continue;
            }

            // Create new member
            try {
                await base44.asServiceRole.entities.CreatorGroupMember.create({
                    group_id: group.id,
                    user_email: email,
                    name: name,
                    role: 'member',
                    status: 'active',
                    level: 'Member', // Default level
                    joined_date: new Date().toISOString(),
                    source: 'nuts_bots_sync' 
                });
                addedCount++;
                console.log(`Added ${email} with name ${name}`);
            } catch (err) {
                console.error(`Failed to add ${email}: ${err.message}`);
                errors.push({ email, action: 'create', error: err.message });
            }
        }

        return Response.json({
            success: true,
            group_name: group.name,
            total_eligible: eligibleUsers.length,
            added: addedCount,
            updated: updatedCount,
            skipped: skippedCount,
            errors: errors
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
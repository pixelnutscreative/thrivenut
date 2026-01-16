import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        // Allow this to be run by admins only (or service role if automated, but check user role for manual trigger)
        // Since we might trigger this via test tool, we'll check if user exists.
        // For automation, we might need to skip this check or use a secret key.
        // Assuming manual trigger by admin for now.
        if (user && user.role !== 'admin' && user.email !== 'pixelnutscreative@gmail.com') {
             return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Find the target group
        // Try exact match first
        let groups = await base44.asServiceRole.entities.CreatorGroup.filter({ name: "Pixel's AI Toolbox" });
        if (groups.length === 0) {
            // Try case insensitive search manually if regex not supported in basic filter or just list all
            const allGroups = await base44.asServiceRole.entities.CreatorGroup.list();
            const target = allGroups.find(g => g.name.toLowerCase().includes("toolbox") && g.name.toLowerCase().includes("pixel"));
            if (target) groups = [target];
        }

        if (groups.length === 0) {
            return Response.json({ error: "Could not find group 'Pixel's AI Toolbox'" }, { status: 404 });
        }
        const group = groups[0];
        console.log(`Found target group: ${group.name} (${group.id})`);

        // 2. Get all AI Platform Users
        const aiUsers = await base44.asServiceRole.entities.AIPlatformUser.list(undefined, 1000);
        console.log(`Found ${aiUsers.length} AI Platform Users`);

        // 3. Sync them
        let addedCount = 0;
        let skippedCount = 0;
        let errors = [];

        // Fetch existing members for efficiency
        const existingMembers = await base44.asServiceRole.entities.CreatorGroupMember.filter({ group_id: group.id }, undefined, 1000);
        const existingEmails = new Set(existingMembers.map(m => m.user_email.toLowerCase()));

        for (const aiUser of aiUsers) {
            const email = aiUser.user_email?.trim().toLowerCase();
            if (!email) continue;

            if (existingEmails.has(email)) {
                skippedCount++;
                continue;
            }

            try {
                await base44.asServiceRole.entities.CreatorGroupMember.create({
                    group_id: group.id,
                    user_email: email,
                    role: 'member',
                    status: 'active',
                    level: 'Creator', // Default level for AI users? User screenshot shows "Creator"
                    joined_date: new Date().toISOString(),
                    source: 'ai_tool_sync' 
                });
                addedCount++;
                console.log(`Added ${email}`);
            } catch (err) {
                console.error(`Failed to add ${email}: ${err.message}`);
                errors.push({ email, error: err.message });
            }
        }

        return Response.json({
            success: true,
            group_name: group.name,
            total_ai_users: aiUsers.length,
            added: addedCount,
            skipped: skippedCount,
            errors: errors
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
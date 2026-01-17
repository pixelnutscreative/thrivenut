import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { action, group_id, user_email, proof_url, referred_by, level_name } = await req.json();

        // 1. Auth Check
        const currentUser = await base44.auth.me();
        if (!currentUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Member Record
        // If we are acting on someone else (admin), we need that user's email.
        // If acting on self (becoming interested), use currentUser.email.
        const targetEmail = user_email || currentUser.email;

        const members = await base44.entities.CreatorGroupMember.filter({
            group_id: group_id,
            user_email: targetEmail
        });

        let member = members[0];
        
        // 3. Logic Switch
        if (action === 'become_interested') {
            // Self-action: Invited -> Interested
            if (!member) {
                // Should exist if invited, but create if not (public join flow)
                member = await base44.entities.CreatorGroupMember.create({
                    group_id,
                    user_email: currentUser.email,
                    role: 'member',
                    level: 'Interested',
                    status: 'interested',
                    joined_date: new Date().toISOString(),
                    pending_approval: false
                });
            } else {
                 await base44.entities.CreatorGroupMember.update(member.id, {
                    status: 'interested',
                    level: 'Interested',
                    pending_approval: false
                });
            }
            return Response.json({ status: 'success', member });
        }

        if (action === 'submit_application') {
             // Self-action: Interested -> Pending Approval
             if (!member) return Response.json({ error: 'Member not found' }, { status: 404 });
             
             await base44.entities.CreatorGroupMember.update(member.id, {
                 pending_approval: true,
                 proof_of_payment_url: proof_url,
                 referred_by_name: referred_by
             });
             return Response.json({ status: 'success' });
        }

        // --- Admin Actions Below ---
        
        // Check Admin Permissions
        const adminMembers = await base44.entities.CreatorGroupMember.filter({
            group_id: group_id,
            user_email: currentUser.email
        });
        const isAdmin = adminMembers[0] && ['owner', 'admin', 'manager'].includes(adminMembers[0].role);

        if (!isAdmin) {
             return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (action === 'approve_member') {
            // Interested -> Active Member
            if (!member) return Response.json({ error: 'Member not found' }, { status: 404 });

            const group = await base44.entities.CreatorGroup.get(group_id);

            // --- RESTRICTED MODE LOGIC START ---
            if (group.restrict_new_members) {
                const targetEmail = member.user_email;
                
                // Check if user is "new-ish" (only member of this group)
                // We count active memberships.
                const activeMemberships = await base44.entities.CreatorGroupMember.filter({ 
                    user_email: targetEmail, 
                    status: 'active' 
                });
                
                // If they have 0 active memberships (about to be 1), or just this one (already active?)
                // Since we are approving them now, they currently have 0 (or others).
                const otherActiveGroups = activeMemberships.filter(m => m.group_id !== group_id);

                if (otherActiveGroups.length === 0) {
                     // Fetch or Create Preferences
                     let prefs = await base44.entities.UserPreferences.filter({ user_email: targetEmail });
                     let prefData = {
                         user_email: targetEmail,
                         enabled_modules: ['my_groups'], // Restrict to only groups
                     };
                     
                     if (group.force_landing_page) {
                         prefData.default_landing_page = `CreatorGroups?id=${group_id}`;
                     }

                     if (prefs.length === 0) {
                         await base44.entities.UserPreferences.create(prefData);
                     } else {
                         // Only update if they haven't completed onboarding or explicit override
                         // For now, force it as requested for "Social House" style groups
                         await base44.entities.UserPreferences.update(prefs[0].id, prefData);
                     }
                }
            }
            // --- RESTRICTED MODE LOGIC END ---

            const updates = {
                status: 'active',
                role: 'member',
                level: level_name || 'Member', // Default to generic 'Member' or passed level
                pending_approval: false,
                is_paid_member: true
            };

            // Handle Trial
            if (group.trial_period_days && group.trial_period_days > 0) {
                 updates.status = 'trial';
                 const endDate = new Date();
                 endDate.setDate(endDate.getDate() + group.trial_period_days);
                 updates.trial_end_date = endDate.toISOString();
                 // Maybe is_paid_member is false during trial? Or true? 
                 // Let's assume false until trial converts, or true if trial gives full access. 
                 // Let's keep is_paid_member = false for trial unless specified.
                 updates.is_paid_member = false; 
            }

            await base44.entities.CreatorGroupMember.update(member.id, updates);
            return Response.json({ status: 'success', updates });
        }

        if (action === 'reject_member') {
             if (!member) return Response.json({ error: 'Member not found' }, { status: 404 });
             
             await base44.entities.CreatorGroupMember.update(member.id, {
                 pending_approval: false,
                 status: 'interested' // Reset to interested, or invited?
                 // Keeping at interested allows them to resubmit easily
             });
             return Response.json({ status: 'success' });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
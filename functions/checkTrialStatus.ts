import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This function is intended to be called periodically or on group load
        // It checks if any "trial" status members have passed their trial_end_date
        
        // Since we can't easily iterate ALL members in the system efficiently without a query filter,
        // we'll support two modes:
        // 1. Check specific user (e.g. on login/group load)
        // 2. Check specific group (admin button)

        const { group_id, user_email, mode } = await req.json();

        // Mode 1: Single User Check (Auto-run on frontend)
        if (user_email && group_id) {
             const members = await base44.entities.CreatorGroupMember.filter({
                group_id: group_id,
                user_email: user_email,
                status: 'trial'
            });
            
            if (members.length > 0) {
                const member = members[0];
                if (member.trial_end_date && new Date(member.trial_end_date) < new Date()) {
                    await base44.entities.CreatorGroupMember.update(member.id, {
                        status: 'trial_expired'
                    });
                    return Response.json({ status: 'expired', member_id: member.id });
                }
            }
            return Response.json({ status: 'active' });
        }

        // Mode 2: Bulk Check for Group (Admin)
        // Note: SDK filter might not support complex date comparisons directly in one go depending on backend caps,
        // so we might need to fetch all 'trial' members and filter in code.
        if (mode === 'bulk_group' && group_id) {
            // Check auth
             const currentUser = await base44.auth.me();
             if (!currentUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });
             
            const members = await base44.entities.CreatorGroupMember.filter({
                group_id: group_id,
                status: 'trial'
            });

            let expiredCount = 0;
            const now = new Date();

            for (const member of members) {
                if (member.trial_end_date && new Date(member.trial_end_date) < now) {
                     await base44.entities.CreatorGroupMember.update(member.id, {
                        status: 'trial_expired'
                    });
                    expiredCount++;
                }
            }
            return Response.json({ status: 'success', expired_count: expiredCount });
        }

        return Response.json({ error: 'Invalid parameters' }, { status: 400 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
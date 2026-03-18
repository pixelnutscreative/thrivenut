import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { group_id, title, message, link, type, target_email, exclude_email } = await req.json();

        if (!group_id || !title || !message) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let recipients = [];

        if (target_email) {
            // Targeted notification (single user)
            recipients = [{ user_email: target_email }];
        } else {
            // Broadcast to group members
            const members = await base44.asServiceRole.entities.CreatorGroupMember.filter({ group_id: group_id });
            recipients = members;
            
            // If admins only needed, we might need a flag, but usually "submitted request" goes to admins.
            // For now, if type is 'support_request', maybe filter for admins?
            // The prompt says "Notification: Bell icon alerts for... Request submitted". Usually to admins.
            // But let's keep it simple: caller decides target_email or broadcast.
            // If caller wants to notify admins, they might need to fetch admins first or we add a 'role' filter here.
            // Let's add 'target_role' param.
        }

        // Filter out excluded email (usually the sender)
        if (exclude_email) {
            recipients = recipients.filter(r => r.user_email !== exclude_email);
        }

        const notifications = recipients.map(member => ({
            user_email: member.user_email,
            title: title,
            message: message,
            type: type || 'group_notification',
            link: link,
            is_read: false,
            is_active: true,
            group_id: group_id,
            created_at: new Date().toISOString()
        }));
        
        if (notifications.length > 0) {
            await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
        }

        return Response.json({ success: true, count: notifications.length });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
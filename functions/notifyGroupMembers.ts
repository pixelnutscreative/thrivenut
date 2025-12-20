import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { group_id, title, message, link, type } = await req.json();

        if (!group_id || !title || !message) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get group members
        // Use service role to ensure we get all members even if privacy rules exist (though standard users can usually see members if they are in the group)
        // But here we definitely need to list them.
        const members = await base44.asServiceRole.entities.CreatorGroupMember.filter({ group_id: group_id });

        const notifications = members.map(member => ({
            user_email: member.user_email,
            title: title,
            message: message,
            type: type || 'group_notification',
            link: link,
            is_read: false,
            created_at: new Date().toISOString()
        }));

        // Batch create
        // Assuming bulkCreate exists or we map over creates.
        // Base44 SDK usually supports bulkCreate or we loop.
        // Checking documentation in system prompt: "base44.entities.Todo.bulkCreate([...]) will create 2 new todos."
        
        if (notifications.length > 0) {
            await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
        }

        return Response.json({ success: true, count: notifications.length });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
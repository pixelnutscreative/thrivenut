import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { myGroupIds } = await req.json();

    if (!myGroupIds || myGroupIds.length === 0) {
      return Response.json({ groupAnnouncements: [] });
    }

    // Single query to fetch all group announcements across all groups at once
    // This replaces the Promise.all() pattern that made N separate requests
    const groupNotifications = await base44.asServiceRole.entities.Notification.filter({
      group_id: { $in: myGroupIds },
      is_active: true,
      type: 'announcement'
    }, '-created_date', 50);

    // Map to the format AnnouncementBar expects
    const groupAnnouncements = groupNotifications.map(n => ({
      id: n.id,
      message: n.message,
      link: n.link,
      background_color: n.button_color || '#8b5cf6',
      text_color: '#ffffff',
      is_active: true,
      schedule_type: 'manual',
      display_order: 100,
      type: 'group_announcement',
      group_id: n.group_id
    }));

    return Response.json({ groupAnnouncements });

  } catch (error) {
    console.error('Error in getGroupAnnouncements:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
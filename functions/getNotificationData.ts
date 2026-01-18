import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { userEmail } = await req.json();
    const effectiveEmail = userEmail || user.email;

    // Fetch all in parallel on backend (higher rate limits)
    const [preferences, memberships, notifications] = await Promise.all([
      base44.asServiceRole.entities.UserPreferences.filter({ user_email: effectiveEmail }),
      base44.asServiceRole.entities.CreatorGroupMember.filter({ user_email: effectiveEmail, status: 'active' }),
      base44.asServiceRole.entities.Notification.filter({ is_active: true, recipient_email: effectiveEmail }, '-created_date', 100)
    ]);

    return Response.json({
      preferences: preferences[0] || {},
      myGroupIds: memberships.map(m => m.group_id),
      notifications: notifications
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
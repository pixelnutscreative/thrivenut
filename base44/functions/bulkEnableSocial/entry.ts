import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check
    const adminEmails = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'];
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Get all platform users
    const platformUsers = await base44.asServiceRole.entities.AIPlatformUser.list();

    // Update all to enable social access
    const updates = platformUsers.map(u => 
      base44.asServiceRole.entities.AIPlatformUser.update(u.id, {
        includes_social_access: true
      })
    );

    await Promise.all(updates);

    return Response.json({ 
      success: true, 
      updated: platformUsers.length,
      message: `Enabled social access for ${platformUsers.length} users`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
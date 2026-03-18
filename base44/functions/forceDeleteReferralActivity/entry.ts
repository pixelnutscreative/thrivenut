import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user email from request body
    const { targetEmail } = await req.json().catch(() => ({ targetEmail: user.email }));
    const emailToDelete = targetEmail || user.email;

    // Fetch all activities for this user
    const activities = await base44.asServiceRole.entities.ReferralActivity.filter({ 
      referrer_email: emailToDelete 
    });

    console.log(`Found ${activities.length} activities for ${emailToDelete}`);

    // Delete each one individually
    const deletedIds = [];
    for (const activity of activities) {
      try {
        await base44.asServiceRole.entities.ReferralActivity.delete(activity.id);
        deletedIds.push(activity.id);
        console.log(`Deleted activity ${activity.id}`);
      } catch (error) {
        console.error(`Failed to delete activity ${activity.id}:`, error.message);
      }
    }

    // Reset link stats
    const links = await base44.asServiceRole.entities.ReferralLink.filter({ 
      user_email: emailToDelete 
    });

    for (const link of links) {
      await base44.asServiceRole.entities.ReferralLink.update(link.id, {
        total_clicks: 0,
        total_signups: 0,
        total_upgrades: 0
      });
    }

    return Response.json({ 
      success: true,
      deletedCount: deletedIds.length,
      deletedIds,
      resetLinks: links.length
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all referral activities for this user
    const activities = await base44.asServiceRole.entities.ReferralActivity.filter({ 
      referrer_email: user.email 
    });

    let deletedCount = 0;
    for (const activity of activities) {
      await base44.asServiceRole.entities.ReferralActivity.delete(activity.id);
      deletedCount++;
    }

    // Also reset the link stats
    const links = await base44.asServiceRole.entities.ReferralLink.filter({ 
      user_email: user.email 
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
      deletedActivities: deletedCount,
      resetLinks: links.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
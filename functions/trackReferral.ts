import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { referralCode, activityType, email, sourceType, sourceDetail } = await req.json();

    if (!referralCode) {
      return Response.json({ error: 'Referral code required' }, { status: 400 });
    }

    // Parse referral code to extract base code and tracking identifier
    // Format: baseCode-trackingId (e.g., "pixel-tiktok1" -> base: "pixel", tracking: "tiktok1")
    const codeLower = referralCode.toLowerCase();
    const parts = codeLower.split('-');
    const baseCode = parts[0];
    const trackingIdentifier = parts.length > 1 ? parts.slice(1).join('-') : null;

    // Find referral link using base code (case-insensitive)
    const links = await base44.asServiceRole.entities.ReferralLink.filter({ 
      referral_code: baseCode,
      is_active: true
    });

    if (links.length === 0) {
      return Response.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    const referralLink = links[0];

    // Log activity with enhanced tracking
    await base44.asServiceRole.entities.ReferralActivity.create({
      referral_code: codeLower,
      base_code: baseCode,
      tracking_identifier: trackingIdentifier,
      referrer_email: referralLink.user_email,
      referred_email: email || null,
      activity_type: activityType, // 'click', 'signup', 'upgrade'
      source_type: sourceType || null,
      source_detail: sourceDetail || null,
      activity_date: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    });

    // Update counts
    if (activityType === 'click') {
      await base44.asServiceRole.entities.ReferralLink.update(referralLink.id, {
        total_clicks: (referralLink.total_clicks || 0) + 1
      });
    } else if (activityType === 'signup') {
      await base44.asServiceRole.entities.ReferralLink.update(referralLink.id, {
        total_signups: (referralLink.total_signups || 0) + 1
      });
    } else if (activityType === 'upgrade') {
      await base44.asServiceRole.entities.ReferralLink.update(referralLink.id, {
        total_upgrades: (referralLink.total_upgrades || 0) + 1
      });
    }

    return Response.json({ 
      success: true,
      message: 'Activity tracked'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
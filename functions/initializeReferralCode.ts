import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

function generateRandomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a referral link
    const existingLinks = await base44.asServiceRole.entities.ReferralLink.filter({ 
      user_email: user.email 
    });

    if (existingLinks.length > 0) {
      return Response.json({ 
        success: true,
        referral_code: existingLinks[0].referral_code,
        message: 'Already has referral code'
      });
    }

    // Generate unique code
    let code = generateRandomCode();
    let attempts = 0;
    
    while (attempts < 10) {
      const existing = await base44.asServiceRole.entities.ReferralLink.filter({ 
        referral_code: code 
      });
      if (existing.length === 0) break;
      code = generateRandomCode();
      attempts++;
    }

    // Create referral link
    const newLink = await base44.asServiceRole.entities.ReferralLink.create({
      user_email: user.email,
      referral_code: code,
      total_clicks: 0,
      total_signups: 0,
      total_upgrades: 0,
      reward_level: 1,
      is_active: true
    });

    // Create user verification record
    const referralCodeUsed = sessionStorage?.getItem?.('referral_code') || null;
    
    await base44.asServiceRole.entities.UserVerification.create({
      user_email: user.email,
      signup_date: new Date().toISOString(),
      referral_code_used: referralCodeUsed,
      has_logged_in: true,
      days_active: 1,
      last_activity_date: new Date().toISOString()
    });

    // Track signup if they used a referral code
    if (referralCodeUsed) {
      await base44.asServiceRole.functions.invoke('trackReferral', {
        referralCode: referralCodeUsed,
        activityType: 'signup',
        email: user.email
      });
    }

    return Response.json({ 
      success: true,
      referral_code: code,
      message: 'Referral code generated'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
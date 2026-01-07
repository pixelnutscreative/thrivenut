import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create verification record
    const userEmail = user.email.toLowerCase();
    let verification = await base44.asServiceRole.entities.UserVerification.filter({
      user_email: userEmail
    });

    if (verification.length === 0) {
      // Create new verification record
      const referralCode = sessionStorage.getItem('referral_code');
      verification = await base44.asServiceRole.entities.UserVerification.create({
        user_email: userEmail,
        signup_date: new Date().toISOString(),
        referral_code_used: referralCode || null,
        has_logged_in: true,
        days_active: 1,
        last_activity_date: new Date().toISOString()
      });
    } else {
      verification = verification[0];
      
      // Update activity
      const lastActivity = verification.last_activity_date ? new Date(verification.last_activity_date) : null;
      const today = new Date().toISOString().split('T')[0];
      const lastActivityDate = lastActivity ? lastActivity.toISOString().split('T')[0] : null;
      
      const updates = {
        has_logged_in: true,
        last_activity_date: new Date().toISOString()
      };

      // Increment days_active if different day
      if (lastActivityDate !== today) {
        updates.days_active = (verification.days_active || 0) + 1;
      }

      await base44.asServiceRole.entities.UserVerification.update(verification.id, updates);
      verification = { ...verification, ...updates };
    }

    // Auto-verify if:
    // - Logged in at least once
    // - Active for 3+ unique days
    // - Completed onboarding (check UserPreferences)
    const prefs = await base44.entities.UserPreferences.filter({ user_email: userEmail });
    const hasCompletedOnboarding = prefs[0]?.onboarding_completed || false;

    if (
      verification.days_active >= 3 && 
      hasCompletedOnboarding && 
      !verification.is_real_user
    ) {
      await base44.asServiceRole.entities.UserVerification.update(verification.id, {
        is_real_user: true,
        verification_date: new Date().toISOString(),
        verification_method: 'auto'
      });

      // Track signup if they used referral code
      if (verification.referral_code_used) {
        await base44.asServiceRole.functions.invoke('trackReferral', {
          referralCode: verification.referral_code_used,
          activityType: 'signup',
          email: user.email
        });
      }

      // Check if user should get social media suite access
      // 1. Check if they're in AIPlatformUser with includes_social_access
      const platformUser = await base44.asServiceRole.entities.AIPlatformUser.filter({
        user_email: userEmail
      });

      if (platformUser.length > 0 && platformUser[0].includes_social_access) {
        // Grant social access via UserPreferences
        // Refresh prefs to be sure
        const existingPrefs = await base44.asServiceRole.entities.UserPreferences.filter({ user_email: userEmail });
        
        if (existingPrefs.length > 0) {
          await base44.asServiceRole.entities.UserPreferences.update(existingPrefs[0].id, {
            tiktok_access_approved: true
          });
        } else {
          await base44.asServiceRole.entities.UserPreferences.create({
            user_email: userEmail,
            tiktok_access_approved: true,
            onboarding_completed: true
          });
        }
      }

      return Response.json({
        success: true,
        verified: true,
        message: 'User verified as real!'
      });
    }

    return Response.json({
      success: true,
      verified: verification.is_real_user,
      daysActive: verification.days_active,
      needsMoreActivity: verification.days_active < 3,
      needsOnboarding: !hasCompletedOnboarding
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { code } = await req.json();
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 });
    }

    if (!code) {
      return Response.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    // Find the coupon
    const coupons = await base44.asServiceRole.entities.CouponCode.filter({
      code: code
    });

    // Case-insensitive check just in case
    const coupon = coupons.find(c => c.code.toLowerCase() === code.toLowerCase());

    if (!coupon) {
      return Response.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    if (coupon.status === 'redeemed' || coupon.is_used) {
      return Response.json({ error: 'This coupon has already been redeemed' }, { status: 400 });
    }

    if (coupon.status === 'expired') {
      return Response.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    // Perform Redemption
    // 1. Update User Preferences
    // Find the package to grant
    let packageId = coupon.grant_subscription_package_id;
    
    // If no specific package assigned, try to find the "Thrive Nut" equivalent
    if (!packageId) {
      const packages = await base44.asServiceRole.entities.SubscriptionPackage.list();
      // Look for "Annual" or "Social Media Suite" or create default
      const defaultPackage = packages.find(p => 
        p.name.includes('Annual') || p.interval === 'year'
      );
      if (defaultPackage) packageId = defaultPackage.id;
    }

    // Get user prefs
    const prefs = await base44.asServiceRole.entities.UserPreferences.filter({ user_email: user.email });
    const userPref = prefs[0];

    // Grant access
    const updateData = {
      subscription_status: 'active',
      subscription_package_id: packageId,
      // Enable all standard modules
      enabled_modules: [
        'tiktok', 'goals', 'wellness', 'journal', 
        'supplements', 'medications', 'pets', 'care_reminders', 
        'people', 'mental_health', 'finance', 'activity', 'motivations'
      ]
    };

    if (userPref) {
      await base44.asServiceRole.entities.UserPreferences.update(userPref.id, updateData);
    } else {
      await base44.asServiceRole.entities.UserPreferences.create({
        user_email: user.email,
        ...updateData
      });
    }

    // 2. Mark Coupon as Redeemed
    await base44.asServiceRole.entities.CouponCode.update(coupon.id, {
      status: 'redeemed',
      is_used: true,
      used_date: new Date().toISOString(),
      redeemed_by_email: user.email
    });

    return Response.json({
      success: true,
      message: 'Gift redeemed successfully! Welcome to Thrive Nut!',
      packageName: packageId ? 'Premium Access' : 'Thrive Nut Annual'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
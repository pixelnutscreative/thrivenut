import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count verified AI tool purchases for this user
    const purchases = await base44.asServiceRole.entities.AIToolPurchase.filter({
      referred_by_user_id: user.email
    });

    const verifiedPurchases = purchases.filter(p => p.verified === true);
    const totalCredits = verifiedPurchases.reduce((sum, p) => sum + (p.credit_earned || 0), 0);
    const verifiedCount = verifiedPurchases.length;

    // Check if eligible for coupon (every 4 purchases)
    const couponsEarned = Math.floor(verifiedCount / 4);
    
    // Check how many coupons already assigned
    const assignedCoupons = await base44.asServiceRole.entities.CouponCode.filter({
      assigned_to_email: user.email
    });

    const couponsToAssign = couponsEarned - assignedCoupons.length;

    if (couponsToAssign <= 0) {
      return Response.json({
        success: false,
        message: 'Not eligible for new coupon yet',
        verifiedCount,
        couponsEarned,
        couponsAssigned: assignedCoupons.length
      });
    }

    // Get available coupon from queue
    const availableCoupons = await base44.asServiceRole.entities.CouponCode.filter({
      status: 'available'
    }, 'created_date', 1);

    if (availableCoupons.length === 0) {
      return Response.json({
        error: 'No coupons available in queue. Contact admin.'
      }, { status: 404 });
    }

    const coupon = availableCoupons[0];

    // Assign coupon to user
    await base44.asServiceRole.entities.CouponCode.update(coupon.id, {
      assigned_to_email: user.email,
      credit_amount: totalCredits,
      unlocked_date: new Date().toISOString(),
      status: 'assigned'
    });

    return Response.json({
      success: true,
      coupon: coupon.code,
      creditAmount: totalCredits,
      message: 'Coupon unlocked!'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
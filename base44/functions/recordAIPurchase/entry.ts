import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin only endpoint
    const user = await base44.auth.me();
    const adminEmails = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'];
    
    if (!user || !adminEmails.includes(user.email.toLowerCase())) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { 
      buyerEmail, 
      referredByUserId, 
      productType, // 'pixels_ai_toolbox' or 'nuts_and_bots' or 'nuts_and_bots_plus_ai'
      subscriptionType, // 'annual' or 'monthly'
      purchaseAmount,
      stripePaymentId,
      externalPurchase = false
    } = await req.json();

    if (!buyerEmail || !productType || !subscriptionType || !purchaseAmount) {
      return Response.json({ 
        error: 'Missing required fields: buyerEmail, productType, subscriptionType, purchaseAmount' 
      }, { status: 400 });
    }

    // Only annual subscriptions earn commission
    if (subscriptionType !== 'annual') {
      return Response.json({
        success: false,
        message: 'Only annual subscriptions are eligible for commission'
      });
    }

    // Calculate 22% commission
    const creditEarned = purchaseAmount * 0.22;

    // Create purchase record
    const purchase = await base44.asServiceRole.entities.AIToolPurchase.create({
      buyer_email: buyerEmail,
      referred_by_user_id: referredByUserId || null,
      product_type: productType,
      subscription_type: subscriptionType,
      purchase_amount: purchaseAmount,
      purchase_date: new Date().toISOString(),
      stripe_payment_id: stripePaymentId || null,
      external_purchase: externalPurchase,
      credit_earned: referredByUserId ? creditEarned : 0,
      credit_applied_to_user: referredByUserId || null,
      verified: false // Must be verified after 2 weeks + onboarding
    });

    return Response.json({
      success: true,
      purchase,
      creditEarned: referredByUserId ? creditEarned : 0,
      message: 'Purchase recorded. Will be verified after 2-week period.'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
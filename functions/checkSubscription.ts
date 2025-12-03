import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check local subscription record first
    const subscriptions = await base44.entities.Subscription.filter({
      user_email: user.email,
      status: 'active'
    });

    if (subscriptions.length > 0) {
      const sub = subscriptions[0];
      
      // Check if subscription is still valid
      if (sub.current_period_end && new Date(sub.current_period_end) > new Date()) {
        return Response.json({
          hasActiveSubscription: true,
          subscription: sub,
        });
      }
    }

    // Check Stripe directly
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return Response.json({ hasActiveSubscription: false });
    }

    const stripeSubs = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'active',
      limit: 1,
    });

    if (stripeSubs.data.length > 0) {
      const stripeSub = stripeSubs.data[0];
      
      // Update or create local record
      const subData = {
        user_email: user.email,
        stripe_customer_id: customers.data[0].id,
        stripe_subscription_id: stripeSub.id,
        plan_type: stripeSub.metadata.plan_type || 'monthly',
        status: 'active',
        current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: stripeSub.cancel_at_period_end,
      };

      if (subscriptions.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, subData);
      } else {
        await base44.asServiceRole.entities.Subscription.create(subData);
      }

      return Response.json({
        hasActiveSubscription: true,
        subscription: subData,
      });
    }

    // Check for trialing subscriptions too
    const trialingSubs = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'trialing',
      limit: 1,
    });

    if (trialingSubs.data.length > 0) {
      return Response.json({
        hasActiveSubscription: true,
        subscription: {
          status: 'trialing',
          plan_type: trialingSubs.data[0].metadata.plan_type || 'monthly',
        },
      });
    }

    return Response.json({ hasActiveSubscription: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_type, price_id, success_url, cancel_url } = await req.json();

    // Map plan types to Price IDs if generic types are passed
    // NOTE: You should replace these with your actual Stripe Price IDs
    const PLAN_MAP = {
      'monthly': 'price_monthly_id', // REPLACE WITH REAL ID
      'annual': 'price_annual_id',   // REPLACE WITH REAL ID
    };

    const priceId = price_id || PLAN_MAP[plan_type];

    if (!priceId) {
      return Response.json({ error: 'Invalid plan or price ID' }, { status: 400 });
    }

    // Determine mode based on price type (we assume recurring for subscription)
    // Ideally we fetch the price to check, but for now let's assume 'subscription' for plans
    // and 'payment' for one-time.
    // Safe default: try to retrieve price details or just use subscription for known plans.
    let mode = 'subscription';
    
    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: success_url || `${req.headers.get('origin')}/SubscriptionSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/Pricing`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_type: plan_type || 'custom',
      },
      allow_promotion_codes: true,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@^14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

// TODO: Replace with actual Stripe Price IDs
const PLANS = {
  'monthly': 'price_monthly_placeholder', // $49 for 7 months (one-time)
  'annual': 'price_annual_placeholder',   // $77/year (subscription)
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_type, success_url, cancel_url } = await req.json();
    
    if (!plan_type || !PLANS[plan_type]) {
      return Response.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const priceId = PLANS[plan_type];
    
    // "Monthly" is $49 for 7 months (one-time), "Annual" is subscription
    const mode = plan_type === 'annual' ? 'subscription' : 'payment';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: success_url || `${req.headers.get('origin')}/SubscriptionSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/Pricing`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_type: plan_type
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
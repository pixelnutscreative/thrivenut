import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@^14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth check
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { plan_type } = payload;

    // Define plans
    // Annual: $111/year (Sale $77)
    // Monthly: $49/month
    const plans = {
      monthly: {
        name: "Let's Thrive Monthly",
        amount: 4900, // $49.00
        interval: 'month'
      },
      annual: {
        name: "Let's Thrive Annual (Sale)",
        amount: 7700, // $77.00 (was $111)
        interval: 'year'
      }
    };

    const plan = plans[plan_type];
    if (!plan) {
      return Response.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // Find or create customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data.length > 0 ? customers.data[0].id : null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          base44_user_id: user.id
        }
      });
      customerId = customer.id;
    }

    // Get origin for success/cancel URLs
    const origin = req.headers.get('origin') || 'https://thrivenut.app';

    // Create session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: 'Access to Let\'s Thrive App premium features',
            },
            unit_amount: plan.amount,
            recurring: {
              interval: plan.interval,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${origin}/SubscriptionSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/Pricing`,
      metadata: {
        plan_type: plan_type,
        user_id: user.id,
        user_email: user.email
      }
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
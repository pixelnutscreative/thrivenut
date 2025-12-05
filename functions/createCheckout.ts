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

    const { plan_type } = await req.json();
    
    // Define pricing for Let's Thrive app
    // Holiday special: $7/month for 7 months OR $77/year (normally $111)
    let priceData;
    let mode = 'subscription';
    
    if (plan_type === 'monthly') {
      // $49 one-time for 7 months special (not recurring)
      mode = 'payment';
      priceData = {
        currency: 'usd',
        product_data: {
          name: "Let's Thrive! 7-Month Access (Holiday Special)",
          description: '$49 for 7 months of access - Holiday Special ends Dec 7th!',
        },
        unit_amount: 4900, // $49.00
      };
    } else if (plan_type === 'annual') {
      // $77/year holiday special (normally $111)
      priceData = {
        currency: 'usd',
        product_data: {
          name: "Let's Thrive! Annual (Holiday Special)",
          description: '$77/year - Save with annual! Holiday Special ends Dec 7th!',
        },
        unit_amount: 7700, // $77.00
        recurring: {
          interval: 'year',
        },
      };
    } else {
      return Response.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          user_id: user.id,
          app: 'lets_thrive',
        },
      });
      customerId = customer.id;
    }

    // Get the app URL for redirects
    const appId = Deno.env.get("BASE44_APP_ID");
    const baseUrl = `https://${appId}.base44.app`;

    const sessionConfig = {
      customer: customerId,
      mode: mode,
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/SubscriptionSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/Pricing`,
      metadata: {
        user_email: user.email,
        plan_type: plan_type,
      },
    };

    // Only add subscription_data for subscription mode
    if (mode === 'subscription') {
      sessionConfig.subscription_data = {
        metadata: {
          user_email: user.email,
          plan_type: plan_type,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
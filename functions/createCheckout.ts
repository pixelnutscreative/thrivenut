import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@^14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { priceId, price_data, successUrl, cancelUrl } = await req.json();

    if (!priceId && !price_data) {
      return new Response(JSON.stringify({ error: 'Missing priceId or price_data' }), { status: 400 });
    }

    let line_items;
    let mode;

    if (priceId) {
      const price = await stripe.prices.retrieve(priceId);
      mode = price.type === 'recurring' ? 'subscription' : 'payment';
      line_items = [{ price: priceId, quantity: 1 }];
    } else if (price_data) {
      mode = price_data.recurring ? 'subscription' : 'payment';
      line_items = [{ price_data: price_data, quantity: 1 }];
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: mode,
      success_url: successUrl || `${req.headers.get('origin')}/SubscriptionSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/Pricing`,
      customer_email: user.email,
      metadata: {
        user_email: user.email,
        user_id: user.id
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
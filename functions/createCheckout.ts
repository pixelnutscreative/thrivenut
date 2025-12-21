import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@^14.0.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, quantity = 1, successUrl, cancelUrl, mode } = await req.json();

    if (!priceId) {
      return Response.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Determine mode if not provided
    let sessionMode = mode;
    if (!sessionMode) {
      // Fetch price to check if it's recurring
      const price = await stripe.prices.retrieve(priceId);
      sessionMode = price.type === 'recurring' ? 'subscription' : 'payment';
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      mode: sessionMode,
      success_url: successUrl || `${req.headers.get("origin")}/SubscriptionSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/Pricing`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        userEmail: user.email
      },
    });

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
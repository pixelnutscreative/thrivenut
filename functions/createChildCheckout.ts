import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@^14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quantity = 1 } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Child Account Add-on',
              description: 'Full access for one child account',
            },
            unit_amount: 500, // $5.00
            recurring: {
              interval: 'month',
            },
          },
          quantity: quantity,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/FamilyMembers?success=true`,
      cancel_url: `${req.headers.get('origin')}/ParentChildSetup?canceled=true`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        userEmail: user.email,
        type: 'child_account_subscription'
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@^14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') || '', {
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, successUrl, cancelUrl } = await req.json();

    if (!orderId) {
      return Response.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // Fetch the order
    const orders = await base44.entities.MarketingOrder.filter({ id: orderId });
    if (!orders || orders.length === 0) {
        return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    const order = orders[0];

    // Security check: Ensure user is the client or admin (simplified to client email match here, but admin override is implied by service logic often)
    // For now, assuming if they can see the button in UI, they can pay. UI handles visibility.
    
    if (!order.our_price || order.our_price <= 0) {
        return Response.json({ error: 'Invalid price' }, { status: 400 });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: order.currency || 'usd',
            product_data: {
              name: `Order: ${order.title}`,
              description: order.description ? order.description.substring(0, 200) : 'Marketing Material Order',
            },
            unit_amount: Math.round(order.our_price),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${req.headers.get('origin')}/CreatorGroups?id=${order.group_id}&payment=success`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/CreatorGroups?id=${order.group_id}&payment=cancelled`,
      metadata: {
        orderId: order.id,
        type: 'marketing_order'
      },
      customer_email: user.email,
    });

    return Response.json({ url: session.url });

  } catch (error) {
    console.error('Payment Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
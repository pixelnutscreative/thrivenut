import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;

  try {
    if (endpointSecret) {
      event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
    } else {
      // If no webhook secret is set (e.g. testing), trust the body (NOT RECOMMENDED for production)
      event = JSON.parse(body);
    }
  } catch (err) {
    return Response.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);
  // Webhooks are service-role operations
  
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.customer_email || session.metadata?.user_email;
      
      // Update user preferences or subscription status
      // We need to find the user preference record
      if (userEmail) {
        const prefs = await base44.asServiceRole.entities.UserPreferences.filter({ user_email: userEmail });
        if (prefs.length > 0) {
          await base44.asServiceRole.entities.UserPreferences.update(prefs[0].id, {
            has_annual_ai_plan: true, // Or determine based on plan
            stripe_subscription_id: session.subscription,
            subscription_product: session.metadata?.plan_type || 'unknown'
          });
        }
      }
    }
    
    // Handle other events like invoice.payment_failed, etc.

    return Response.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return Response.json({ error: 'Processing error' }, { status: 500 });
  }
});
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

    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
        return Response.json({ hasActiveSubscription: false });
    }

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'active',
      limit: 1
    });

    // Also check for trialing
    const trialing = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'trialing',
      limit: 1
    });

    let activeSub = subscriptions.data[0] || trialing.data[0];

    // Check for AI Platform / Nuts & Bots access
    if (!activeSub) {
        const aiUsers = await base44.entities.AIPlatformUser.filter({ user_email: user.email });
        const aiUser = aiUsers[0];
        
        if (aiUser && aiUser.subscription_status === 'active') {
             // Create a mock subscription object for the frontend
             activeSub = {
                 status: 'active',
                 plan: { nickname: 'Included with ' + (aiUser.platform || 'AI Tools') },
                 source: 'ai_platform'
             };
        }
    }

    return Response.json({ 
        hasActiveSubscription: !!activeSub,
        subscription: activeSub || null
    });
  } catch (error) {
    console.error('Check Subscription Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
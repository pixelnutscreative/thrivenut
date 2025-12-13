import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      return Response.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
    }

    // Handle successful checkout/subscription
    if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
      const session = event.data.object;
      
      const customerEmail = session.customer_email || session.customer_details?.email;
      const customerId = session.customer;
      
      if (!customerEmail) {
        return Response.json({ error: 'No customer email found' }, { status: 400 });
      }

      // Get customer for metadata
      const customer = await stripe.customers.retrieve(customerId);
      
      // Determine product type from line items
      let productType = 'pixels_ai_toolbox'; // default
      let subscriptionType = 'annual';
      let purchaseAmount = 333;
      
      if (session.line_items) {
        const items = session.line_items.data || [];
        for (const item of items) {
          const productName = item.description || '';
          if (productName.includes('Nuts') || productName.includes('nuts')) {
            productType = 'nuts_and_bots_plus_ai';
            purchaseAmount = 333;
          }
          if (productName.includes('Toolbox') || productName.includes('Pixel')) {
            productType = 'pixels_ai_toolbox';
            purchaseAmount = 333;
          }
          
          // Check if monthly
          if (item.price?.recurring?.interval === 'month') {
            subscriptionType = 'monthly';
          }
        }
      }

      // Get referral info from customer metadata
      const referredBy = customer.metadata?.referred_by_user_id || null;

      // Create AIPlatformUser record
      const platformUsers = await base44.asServiceRole.entities.AIPlatformUser.filter({
        user_email: customerEmail
      });

      const platform = productType === 'pixels_ai_toolbox' ? 'pixels_toolbox' : 'lets_go_nuts';
      const hasNutsAndBots = productType.includes('nuts_and_bots');
      const includesSocialAccess = productType.includes('plus_ai') || hasNutsAndBots;

      if (platformUsers.length === 0) {
        // Create new platform user
        await base44.asServiceRole.entities.AIPlatformUser.create({
          user_email: customerEmail,
          user_name: customer.name || '',
          platform: platform,
          subscription_tier: productType.replace(/_/g, ' '),
          has_nuts_and_bots: hasNutsAndBots,
          includes_social_access: includesSocialAccess
        });
      } else {
        // Update existing
        await base44.asServiceRole.entities.AIPlatformUser.update(platformUsers[0].id, {
          platform: platform,
          subscription_tier: productType.replace(/_/g, ' '),
          has_nuts_and_bots: hasNutsAndBots,
          includes_social_access: includesSocialAccess
        });
      }

      // Record AI tool purchase
      await base44.asServiceRole.entities.AIToolPurchase.create({
        buyer_email: customerEmail,
        referred_by_user_id: referredBy,
        product_type: productType,
        subscription_type: subscriptionType,
        purchase_amount: purchaseAmount,
        purchase_date: new Date().toISOString(),
        stripe_payment_id: session.id,
        external_purchase: false,
        credit_earned: referredBy ? purchaseAmount * 0.22 : 0,
        credit_applied_to_user: referredBy,
        verified: false
      });

      return Response.json({ success: true, message: 'Webhook processed' });
    }

    return Response.json({ success: true, message: 'Event not handled' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
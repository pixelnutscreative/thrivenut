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
      event = JSON.parse(body);
    }
  } catch (err) {
    return Response.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);
  
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.customer_email || session.metadata?.user_email;
      
      if (userEmail) {
        // Find user preferences
        const prefsList = await base44.asServiceRole.entities.UserPreferences.filter({ user_email: userEmail });
        let prefId = null;
        let currentModules = [];

        if (prefsList.length > 0) {
          prefId = prefsList[0].id;
          currentModules = prefsList[0].enabled_modules || [];
        } else {
          // Create new if not exists
          const newPref = await base44.asServiceRole.entities.UserPreferences.create({
            user_email: userEmail,
            enabled_modules: ['goals', 'wellness'] // defaults
          });
          prefId = newPref.id;
          currentModules = ['goals', 'wellness'];
        }

        // Process Metadata
        const packageId = session.metadata?.package_id;
        const groupType = session.metadata?.group_type;
        const newModulesJson = session.metadata?.included_modules;
        
        let modulesToUpdate = [...currentModules];
        let isTikTokApproved = prefsList[0]?.tiktok_access_approved || false;

        if (newModulesJson) {
          try {
            const newModules = JSON.parse(newModulesJson);
            // Merge unique modules
            modulesToUpdate = [...new Set([...currentModules, ...newModules])];
            
            if (newModules.includes('tiktok')) {
              isTikTokApproved = true;
            }
          } catch (e) {
            console.error('Error parsing modules metadata', e);
          }
        }

        const updateData = {
          stripe_subscription_id: session.subscription || session.id, // ID for sub, session ID for one-time
          subscription_status: 'active',
          enabled_modules: modulesToUpdate,
          tiktok_access_approved: isTikTokApproved
        };

        if (packageId) {
          updateData.subscription_package_id = packageId;
        }

        if (groupType && groupType !== 'none') {
          updateData.group_creation_type = groupType;
          // Grant higher limits for business/agency
          if (['business', 'agency', 'mlm'].includes(groupType)) {
            updateData.max_groups = 99; 
          }
        }

        await base44.asServiceRole.entities.UserPreferences.update(prefId, updateData);
      }
    }
    
    // Handle subscription updates/cancellations
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      // We might need to find user by stripe_subscription_id
      // This is harder without a direct lookup, but we can filter
      // For now, simpler implementation assuming checkout session logic handles most
      // Ideally, we store customer ID and look up by that.
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return Response.json({ error: 'Processing error' }, { status: 500 });
  }
});
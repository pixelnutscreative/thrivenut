import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@^14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

// Legacy Plans Map (fallback)
const LEGACY_PLANS = {
  'monthly': { amount: 4900, interval: 'month', name: 'Monthly Access' },
  'annual': { amount: 7700, interval: 'year', name: 'Annual Access' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_type, package_id, success_url, cancel_url } = await req.json();
    
    let priceData = null;
    let mode = 'payment';
    let metadata = {
      user_id: user.id,
      user_email: user.email,
    };

    if (package_id) {
      // Fetch dynamic package from DB
      const packages = await base44.entities.SubscriptionPackage.filter({ id: package_id });
      const pkg = packages[0];

      if (!pkg) {
        return Response.json({ error: 'Package not found' }, { status: 404 });
      }

      // Determine Price (Sale vs Regular)
      let finalPrice = pkg.price;
      if (pkg.is_sale && pkg.sale_price) {
        // Check if sale is expired
        if (!pkg.sale_end_date || new Date(pkg.sale_end_date) > new Date()) {
          finalPrice = pkg.sale_price;
        }
      }

      // Determine Interval
      let recurring = undefined;
      if (pkg.interval === 'month') recurring = { interval: 'month' };
      if (pkg.interval === 'year') recurring = { interval: 'year' };
      if (pkg.interval === 'quarter') recurring = { interval: 'month', interval_count: 3 };
      
      // Lifetime / One-time are 'payment' mode
      if (recurring) {
        mode = 'subscription';
      } else {
        mode = 'payment';
      }

      priceData = {
        currency: pkg.currency || 'usd',
        product_data: {
          name: pkg.name,
          description: pkg.description,
        },
        unit_amount: finalPrice,
      };
      
      if (recurring) {
        priceData.recurring = recurring;
      }

      metadata.package_id = pkg.id;
      metadata.package_name = pkg.name;
      metadata.group_type = pkg.group_type; // Important for webhook handler to provision rights
      metadata.included_modules = JSON.stringify(pkg.included_modules || []);

    } else if (plan_type && LEGACY_PLANS[plan_type]) {
      // Legacy Flow
      const plan = LEGACY_PLANS[plan_type];
      priceData = {
        currency: 'usd',
        product_data: { name: plan.name },
        unit_amount: plan.amount,
        recurring: { interval: plan.interval }
      };
      mode = 'subscription';
      metadata.plan_type = plan_type;
    } else {
      return Response.json({ error: 'Invalid plan or package' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: success_url || `${req.headers.get('origin')}/SubscriptionSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/Pricing`,
      customer_email: user.email,
      metadata: metadata,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
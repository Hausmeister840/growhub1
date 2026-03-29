import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🔐 PREMIUM ACCESS CHECK
 * 
 * Überprüft, ob ein User Zugriff auf ein Premium-Feature hat
 */

const PLANS = {
  free: {
    max_diaries: 1,
    ai_credits_monthly: 10,
    advanced_analytics: false,
    marketplace_commission: 15,
    storage_gb: 1
  },
  pro: {
    max_diaries: 5,
    ai_credits_monthly: 100,
    advanced_analytics: true,
    marketplace_commission: 10,
    storage_gb: 10
  },
  expert: {
    max_diaries: 20,
    ai_credits_monthly: 500,
    advanced_analytics: true,
    marketplace_commission: 5,
    storage_gb: 50
  },
  business: {
    max_diaries: -1, // unlimited
    ai_credits_monthly: -1, // unlimited
    advanced_analytics: true,
    marketplace_commission: 0,
    storage_gb: 200
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feature_key } = await req.json();

    if (!feature_key) {
      return Response.json({ error: 'feature_key required' }, { status: 400 });
    }

    // Get user's subscription
    const subscriptions = await base44.entities.Subscription.filter({
      user_email: user.email,
      status: 'active'
    }).catch(() => []);

    const subscription = subscriptions[0] || { 
      plan: 'free', 
      status: 'trial',
      features: PLANS.free
    };

    // Get feature requirements
    const premiumFeatures = await base44.entities.PremiumFeature.filter({
      feature_key: feature_key,
      enabled: true
    }).catch(() => []);

    if (premiumFeatures.length === 0) {
      // Feature doesn't exist or is free for all
      return Response.json({
        success: true,
        allowed: true,
        plan: subscription.plan,
        limits: PLANS[subscription.plan] || PLANS.free
      });
    }

    const feature = premiumFeatures[0];
    
    // Check plan level
    const planLevels = ['free', 'pro', 'expert', 'business'];
    const requiredLevel = planLevels.indexOf(feature.required_plan);
    const userLevel = planLevels.indexOf(subscription.plan);

    const allowed = userLevel >= requiredLevel;

    return Response.json({
      success: true,
      allowed: allowed,
      plan: subscription.plan,
      required_plan: feature.required_plan,
      feature_name: feature.name,
      feature_description: feature.description,
      limits: PLANS[subscription.plan] || PLANS.free,
      upgrade_required: !allowed
    });

  } catch (error) {
    console.error('Premium check error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
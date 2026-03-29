/**
 * 🔐 PREMIUM FEATURE CHECK
 * 
 * Middleware für Premium-Feature Validierung
 */

export const PLANS = {
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

export async function checkPremiumAccess(base44, userEmail, featureKey) {
  try {
    // Get user's subscription
    const subs = await base44.entities.Subscription.filter({
      user_email: userEmail,
      status: 'active'
    });

    const subscription = subs[0] || { plan: 'free', status: 'active' };

    // Check feature access
    const premiumFeatures = await base44.entities.PremiumFeature.filter({
      feature_key: featureKey
    });

    if (premiumFeatures.length === 0) {
      // Feature doesn't exist or is free for all
      return { allowed: true, plan: subscription.plan };
    }

    const feature = premiumFeatures[0];
    const requiredPlanLevel = ['free', 'pro', 'expert', 'business'].indexOf(feature.required_plan);
    const userPlanLevel = ['free', 'pro', 'expert', 'business'].indexOf(subscription.plan);

    const allowed = userPlanLevel >= requiredPlanLevel;

    return {
      allowed: allowed,
      plan: subscription.plan,
      required_plan: feature.required_plan,
      feature_name: feature.name
    };

  } catch (error) {
    console.error('Premium check error:', error);
    // Default to free plan on error
    return { allowed: false, plan: 'free' };
  }
}

export async function getPlanLimits(base44, userEmail) {
  try {
    const subs = await base44.entities.Subscription.filter({
      user_email: userEmail,
      status: 'active'
    });

    const subscription = subs[0] || { plan: 'free' };
    return PLANS[subscription.plan] || PLANS.free;

  } catch (error) {
    console.error('Get plan limits error:', error);
    return PLANS.free;
  }
}

export function createPremiumError(featureName, requiredPlan) {
  return {
    error: 'premium_required',
    message: `${featureName} requires ${requiredPlan} subscription`,
    required_plan: requiredPlan,
    upgrade_url: '/premium'
  };
}
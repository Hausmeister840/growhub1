import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 📊 GET PLAN LIMITS
 * 
 * Gibt die aktuellen Plan-Limits für einen User zurück
 */

const PLANS = {
  free: {
    max_diaries: 1,
    ai_credits_monthly: 10,
    advanced_analytics: false,
    marketplace_commission: 15,
    storage_gb: 1,
    priority_support: false,
    custom_branding: false,
    api_access: false,
    no_ads: false
  },
  pro: {
    max_diaries: 5,
    ai_credits_monthly: 100,
    advanced_analytics: true,
    marketplace_commission: 10,
    storage_gb: 10,
    priority_support: true,
    custom_branding: false,
    api_access: false,
    no_ads: true
  },
  expert: {
    max_diaries: 20,
    ai_credits_monthly: 500,
    advanced_analytics: true,
    marketplace_commission: 5,
    storage_gb: 50,
    priority_support: true,
    custom_branding: true,
    api_access: true,
    no_ads: true
  },
  business: {
    max_diaries: -1, // unlimited
    ai_credits_monthly: -1, // unlimited
    advanced_analytics: true,
    marketplace_commission: 0,
    storage_gb: 200,
    priority_support: true,
    custom_branding: true,
    api_access: true,
    no_ads: true
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription
    const subscriptions = await base44.entities.Subscription.filter({
      user_email: user.email,
      status: 'active'
    }).catch(() => []);

    const subscription = subscriptions[0] || { 
      plan: 'free',
      status: 'trial'
    };

    // Get usage statistics
    const [diaries, aiResponses] = await Promise.all([
      base44.entities.GrowDiary.filter({
        created_by: user.email
      }).catch(() => []),
      
      base44.entities.AIResponse.filter({
        user_email: user.email
      }).catch(() => [])
    ]);

    // Calculate current month's AI usage
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const aiUsageThisMonth = aiResponses.filter(r => 
      new Date(r.created_date) >= monthStart
    ).length;

    const limits = PLANS[subscription.plan] || PLANS.free;

    return Response.json({
      success: true,
      plan: subscription.plan,
      status: subscription.status,
      limits: limits,
      usage: {
        diaries: diaries.length,
        ai_credits_used: aiUsageThisMonth,
        ai_credits_remaining: limits.ai_credits_monthly === -1 
          ? -1 
          : Math.max(0, limits.ai_credits_monthly - aiUsageThisMonth)
      },
      subscription_info: {
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        trial_ends_at: subscription.trial_ends_at
      }
    });

  } catch (error) {
    console.error('Get plan limits error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
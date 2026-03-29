import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const PLAN_CONFIG: Record<string, { name: string; monthly_price_eur: number }> = {
  pro: { name: 'Pro Grower', monthly_price_eur: 9.99 },
  expert: { name: 'Expert Cultivator', monthly_price_eur: 24.99 },
  business: { name: 'Business', monthly_price_eur: 99.99 },
};

const buildFallbackUrl = (planId: string, email: string) => {
  const subject = encodeURIComponent(`GrowHub Premium Upgrade: ${planId}`);
  const body = encodeURIComponent(
    `Hi GrowHub Team,%0D%0A%0D%0Aich moechte auf den Plan "${planId}" upgraden.%0D%0AAccount: ${email}%0D%0A%0D%0ADanke!`
  );
  return `mailto:premium@growhub.app?subject=${subject}&body=${body}`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_id, source = 'unknown', feature = 'premium-feature' } = await req.json().catch(() => ({}));
    const plan = PLAN_CONFIG[plan_id];

    if (!plan) {
      return Response.json({ error: 'Invalid plan_id' }, { status: 400 });
    }

    const checkoutBase = Deno.env.get('STRIPE_CHECKOUT_BASE_URL') || '';
    const fallbackUrl = buildFallbackUrl(plan_id, user.email);

    // Persist intent for support/sales and observability.
    await base44.entities.AppEvent.create({
      user_email: user.email,
      type: 'premium_checkout_intent',
      data: {
        plan_id,
        plan_name: plan.name,
        monthly_price_eur: plan.monthly_price_eur,
        source,
        feature,
      },
      timestamp: new Date().toISOString(),
    }).catch((err) => {
      console.warn('Failed to persist premium checkout intent:', err?.message || err);
    });

    if (!checkoutBase) {
      return Response.json({
        success: true,
        mode: 'fallback',
        fallback_url: fallbackUrl,
      });
    }

    const checkoutUrl = `${checkoutBase}${checkoutBase.includes('?') ? '&' : '?'}plan=${encodeURIComponent(plan_id)}&email=${encodeURIComponent(user.email)}`;

    return Response.json({
      success: true,
      mode: 'checkout',
      checkout_url: checkoutUrl,
    });
  } catch (error) {
    console.error('createCheckoutIntent error:', error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
});

import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ✅ COMPLETE REFERRAL
 * 
 * Called when referred user completes signup/first action
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const serviceBase44 = base44.asServiceRole;

    const { referred_email, referral_code } = await req.json();

    // Find referral
    const referrals = await serviceBase44.entities.Referral.filter({
      referrer_code: referral_code,
      referred_email: referred_email,
      status: 'pending'
    });

    if (referrals.length === 0) {
      return Response.json({ error: 'Referral not found' }, { status: 404 });
    }

    const referral = referrals[0];

    // Update referral status
    await serviceBase44.entities.Referral.update(referral.id, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });

    // Award rewards
    const [referrerUser] = await serviceBase44.entities.User.filter({
      email: referral.referrer_email
    });

    const [referredUser] = await serviceBase44.entities.User.filter({
      email: referred_email
    });

    if (referrerUser) {
      await serviceBase44.entities.User.update(referrerUser.id, {
        xp: (referrerUser.xp || 0) + referral.reward_amount,
        coins: (referrerUser.coins || 0) + 100
      });
    }

    if (referredUser) {
      await serviceBase44.entities.User.update(referredUser.id, {
        xp: (referredUser.xp || 0) + 250,
        coins: (referredUser.coins || 0) + 50
      });
    }

    // Update referral as rewarded
    await serviceBase44.entities.Referral.update(referral.id, {
      status: 'rewarded',
      rewarded_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      rewards: {
        referrer: { xp: referral.reward_amount, coins: 100 },
        referred: { xp: 250, coins: 50 }
      }
    });

  } catch (error) {
    console.error('Complete referral error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
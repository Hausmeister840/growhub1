import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * 🎁 REFERRAL SYSTEM
 * 
 * Creates a referral and rewards both users when completed
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { referred_email } = await req.json();

    if (!referred_email) {
      return Response.json({ error: 'referred_email required' }, { status: 400 });
    }

    if (referred_email === user.email) {
      return Response.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Generate unique referral code
    const referralCode = `GROW${user.id.substring(0, 8).toUpperCase()}`;

    // Check if referral already exists
    const existing = await base44.entities.Referral.filter({
      referrer_email: user.email,
      referred_email: referred_email
    }).catch(() => []);

    if (existing.length > 0) {
      return Response.json({ 
        error: 'Referral already exists' 
      }, { status: 400 });
    }

    // Create referral
    const referral = await base44.entities.Referral.create({
      referrer_email: user.email,
      referrer_code: referralCode,
      referred_email: referred_email,
      status: 'pending',
      reward_type: 'xp',
      reward_amount: 500
    });

    const referralLink = `https://growhub.app/signup?ref=${referralCode}`;

    // Send invite email (best effort; referral remains valid even if email fails)
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: referred_email,
        subject: `${user.display_name || user.email} hat dich zu GrowHub eingeladen`,
        body: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; max-width: 560px;">
            <h2 style="color: #16a34a; margin-bottom: 12px;">🌱 Einladung zu GrowHub</h2>
            <p style="line-height: 1.6;">
              <strong>${user.display_name || user.email}</strong> hat dich eingeladen, GrowHub auszuprobieren.
            </p>
            <p style="line-height: 1.6;">
              Wenn du dich ueber den Link anmeldest, erhaltet ihr beide einen Bonus.
            </p>
            <a href="${referralLink}" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 10px 16px; border-radius: 8px; margin: 8px 0 14px;">
              Jetzt registrieren
            </a>
            <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
              Falls der Button nicht funktioniert, kopiere diesen Link in den Browser:<br/>
              ${referralLink}
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.warn('Referral email failed:', emailError?.message || emailError);
    }

    return Response.json({
      success: true,
      referral: referral,
      referral_link: referralLink
    });

  } catch (error) {
    console.error('Referral creation error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
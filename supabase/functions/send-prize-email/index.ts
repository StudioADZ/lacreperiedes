import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const maskPhone = (phone?: string) => {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 4) return phone || '';
  return `•••• ${digits.slice(-4)}`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!resendApiKey || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'server_not_configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    const { firstName, email, phone, prize, prizeCode, secretCode } = await req.json();

    if (!email || !firstName || !prize || !prizeCode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verify the prize code actually exists in our database before sending an email,
    // to prevent the endpoint from being abused to send arbitrary emails.
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: participation, error: lookupError } = await supabase
      .from('quiz_participations')
      .select('id, email, prize_won')
      .eq('prize_code', String(prizeCode).toUpperCase())
      .maybeSingle();

    if (lookupError || !participation || !participation.prize_won) {
      return new Response(
        JSON.stringify({ error: 'invalid_prize_code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Force the recipient to be the email stored with the prize (caller cannot redirect emails).
    const recipientEmail = participation.email;

    const emailResponse = await resend.emails.send({
      from: 'La Crêperie <noreply@resend.dev>',
      to: [email],
      subject: `🎉 ${firstName}, voici ton code gagnant`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #faf9f7;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 22px rgba(0,0,0,0.10);">
            <div style="background: linear-gradient(135deg, #b8860b 0%, #daa520 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Félicitations ${firstName} !</h1>
              <p style="color: rgba(255,255,255,.88); margin: 8px 0 0 0; font-size: 15px;">Tu as gagné au Quiz de La Crêperie des Saveurs</p>
            </div>
            
            <div style="padding: 30px;">
              <div style="background: linear-gradient(135deg, rgba(184,134,11,0.12) 0%, rgba(218,165,32,0.06) 100%); border: 2px solid rgba(184,134,11,0.30); border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 20px;">
                <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">Ton lot</p>
                <p style="color: #333; margin: 0; font-size: 24px; font-weight: bold;">🎁 ${prize}</p>
              </div>
              
              <div style="background: #f7f2e8; border: 2px solid rgba(184,134,11,0.25); border-radius: 14px; padding: 22px; text-align: center; margin-bottom: 20px;">
                <p style="color: #666; margin: 0 0 10px 0; font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">Code à présenter à la caisse</p>
                <p style="color: #8a5a00; margin: 0; font-size: 34px; font-weight: 900; letter-spacing: 4px; font-family: monospace;">
                  ${prizeCode}
                </p>
              </div>
              
              <div style="background: rgba(34,139,34,0.08); border: 1px solid rgba(34,139,34,0.20); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <p style="color: #333; margin: 0; font-size: 15px; line-height: 1.5;">
                  Ce code est associé au téléphone <strong>${maskPhone(phone)}</strong>.
                  Présente-le au restaurant, directement à la caisse, pour récupérer ton gain.
                </p>
              </div>
              
              ${secretCode ? `
              <div style="background: rgba(34,139,34,0.1); border: 1px dashed rgba(34,139,34,0.3); border-radius: 12px; padding: 15px; text-align: center; margin-bottom: 20px;">
                <p style="color: #228b22; margin: 0 0 5px 0; font-size: 12px;">✨ Code secret du Menu</p>
                <p style="color: #228b22; margin: 0; font-size: 18px; font-weight: bold;">${secretCode}</p>
              </div>
              ` : ''}
              
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0; line-height: 1.5;">
                ⏰ Valable 7 jours • 1 gain max par personne et par semaine<br>
                Code nominatif, vérifié par l'équipe en caisse.
              </p>
            </div>
            
            <div style="background: #faf9f7; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                La Crêperie des Saveurs • Mamers<br>
                Crêpes & Galettes artisanales
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Prize email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error sending email:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'email_error', message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    const { firstName, email, prize, prizeCode, verifyUrl, secretCode } = await req.json();

    if (!email || !firstName || !prize || !prizeCode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const emailResponse = await resend.emails.send({
      from: 'La Crêperie <noreply@resend.dev>',
      to: [email],
      subject: `🎉 ${firstName}, tu as gagné au Quiz !`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #faf9f7;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #b8860b 0%, #daa520 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Félicitations ${firstName} !</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
                Tu as gagné au Quiz de la Crêperie !
              </p>
              
              <!-- Prize Box -->
              <div style="background: linear-gradient(135deg, rgba(184,134,11,0.1) 0%, rgba(218,165,32,0.05) 100%); border: 2px solid rgba(184,134,11,0.3); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
                <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">Ton lot</p>
                <p style="color: #333; margin: 0; font-size: 24px; font-weight: bold;">🎁 ${prize}</p>
              </div>
              
              <!-- Code Box -->
              <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
                <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">Ton code unique</p>
                <p style="color: #333; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 3px; font-family: monospace;">
                  ${prizeCode}
                </p>
              </div>
              
              ${secretCode ? `
              <!-- Secret Code -->
              <div style="background: rgba(34,139,34,0.1); border: 1px dashed rgba(34,139,34,0.3); border-radius: 12px; padding: 15px; text-align: center; margin-bottom: 20px;">
                <p style="color: #228b22; margin: 0 0 5px 0; font-size: 12px;">✨ Code secret du Menu</p>
                <p style="color: #228b22; margin: 0; font-size: 18px; font-weight: bold;">${secretCode}</p>
              </div>
              ` : ''}
              
              <!-- CTA Button -->
              <a href="${verifyUrl}" style="display: block; background: linear-gradient(135deg, #228b22 0%, #32cd32 100%); color: white; text-decoration: none; padding: 16px; border-radius: 12px; text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 20px;">
                Voir mon QR Code
              </a>
              
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                ⏰ Valable 7 jours • 1 gain max par semaine<br>
                Présente ce code ou le QR code au restaurant
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #faf9f7; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                La Crêperie • Mamers<br>
                Crêpes & Galettes artisanales
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Email sent successfully:', emailResponse);

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

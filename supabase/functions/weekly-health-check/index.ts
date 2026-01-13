import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthCheckResult {
  name: string
  status: 'ok' | 'warning' | 'error'
  message: string
  details?: unknown
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  const results: HealthCheckResult[] = []
  let overallStatus: 'ok' | 'warning' | 'error' = 'ok'

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Check database connection
    try {
      const { error } = await supabase.from('quiz_questions').select('id').limit(1)
      if (error) throw error
      results.push({ name: 'Database Connection', status: 'ok', message: 'Connexion à la base de données OK' })
    } catch (err) {
      results.push({ name: 'Database Connection', status: 'error', message: 'Erreur de connexion à la base de données', details: err })
      overallStatus = 'error'
    }

    // 2. Check quiz questions availability
    try {
      const { data: questions, error } = await supabase
        .from('quiz_questions')
        .select('id, category')
        .eq('is_active', true)
      
      if (error) throw error
      
      const count = questions?.length || 0
      if (count < 5) {
        results.push({ name: 'Quiz Questions', status: 'warning', message: `Seulement ${count} questions actives (minimum recommandé: 5)` })
        if (overallStatus === 'ok') overallStatus = 'warning'
      } else {
        results.push({ name: 'Quiz Questions', status: 'ok', message: `${count} questions actives disponibles` })
      }
    } catch (err) {
      results.push({ name: 'Quiz Questions', status: 'error', message: 'Erreur lors de la vérification des questions', details: err })
      overallStatus = 'error'
    }

    // 3. Check weekly stock for current week
    try {
      const { data: weekStart } = await supabase.rpc('get_current_week_start')
      const { data: stock, error } = await supabase
        .from('weekly_stock')
        .select('*')
        .eq('week_start', weekStart)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      if (!stock) {
        results.push({ name: 'Weekly Stock', status: 'warning', message: 'Stock hebdomadaire non initialisé pour cette semaine' })
        if (overallStatus === 'ok') overallStatus = 'warning'
      } else {
        const totalRemaining = stock.formule_complete_remaining + stock.galette_remaining + stock.crepe_remaining
        results.push({ 
          name: 'Weekly Stock', 
          status: 'ok', 
          message: `Stock OK - ${totalRemaining} lots restants`,
          details: {
            formule: stock.formule_complete_remaining,
            galette: stock.galette_remaining,
            crepe: stock.crepe_remaining
          }
        })
      }
    } catch (err) {
      results.push({ name: 'Weekly Stock', status: 'error', message: 'Erreur lors de la vérification du stock', details: err })
      overallStatus = 'error'
    }

    // 4. Check secret menu configuration
    try {
      const { data: weekStart } = await supabase.rpc('get_current_week_start')
      const { data: menu, error } = await supabase
        .from('secret_menu')
        .select('id, menu_name, is_active')
        .eq('week_start', weekStart)
        .maybeSingle()
      
      if (error) throw error
      
      if (!menu) {
        results.push({ name: 'Secret Menu', status: 'warning', message: 'Aucun menu secret configuré pour cette semaine' })
        if (overallStatus === 'ok') overallStatus = 'warning'
      } else if (!menu.is_active) {
        results.push({ name: 'Secret Menu', status: 'warning', message: 'Menu secret inactif pour cette semaine' })
        if (overallStatus === 'ok') overallStatus = 'warning'
      } else {
        results.push({ name: 'Secret Menu', status: 'ok', message: `Menu "${menu.menu_name}" actif` })
      }
    } catch (err) {
      results.push({ name: 'Secret Menu', status: 'error', message: 'Erreur lors de la vérification du menu secret', details: err })
      overallStatus = 'error'
    }

    // 5. Check splash settings
    try {
      const { data: splash, error } = await supabase
        .from('splash_settings')
        .select('id, is_active, event_title')
        .eq('is_active', true)
        .maybeSingle()
      
      if (error) throw error
      
      if (!splash) {
        results.push({ name: 'Splash Screen', status: 'ok', message: 'Pas de splash screen actif (normal si désactivé)' })
      } else {
        results.push({ name: 'Splash Screen', status: 'ok', message: `Splash actif: "${splash.event_title}"` })
      }
    } catch (err) {
      results.push({ name: 'Splash Screen', status: 'error', message: 'Erreur lors de la vérification du splash', details: err })
      overallStatus = 'error'
    }

    // 6. Check recent quiz participations (last 7 days activity)
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { data: participations, error } = await supabase
        .from('quiz_participations')
        .select('id, prize_won')
        .gte('created_at', sevenDaysAgo.toISOString())
      
      if (error) throw error
      
      const count = participations?.length || 0
      const winners = participations?.filter(p => p.prize_won)?.length || 0
      
      results.push({ 
        name: 'Quiz Activity', 
        status: 'ok', 
        message: `${count} participations ces 7 derniers jours (${winners} gagnants)` 
      })
    } catch (err) {
      results.push({ name: 'Quiz Activity', status: 'error', message: 'Erreur lors de la vérification des participations', details: err })
      overallStatus = 'error'
    }

    // 7. Check unclaimed prizes
    try {
      const { data: unclaimed, error } = await supabase
        .from('quiz_participations')
        .select('id, first_name, prize_won, created_at')
        .not('prize_won', 'is', null)
        .eq('prize_claimed', false)
      
      if (error) throw error
      
      const count = unclaimed?.length || 0
      if (count > 5) {
        results.push({ 
          name: 'Unclaimed Prizes', 
          status: 'warning', 
          message: `${count} lots non réclamés (attention aux expirés)`,
          details: unclaimed
        })
        if (overallStatus === 'ok') overallStatus = 'warning'
      } else {
        results.push({ name: 'Unclaimed Prizes', status: 'ok', message: `${count} lot(s) en attente de récupération` })
      }
    } catch (err) {
      results.push({ name: 'Unclaimed Prizes', status: 'error', message: 'Erreur lors de la vérification des lots', details: err })
      overallStatus = 'error'
    }

    const duration = Date.now() - startTime

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      overall_status: overallStatus,
      checks: results,
      summary: {
        total: results.length,
        ok: results.filter(r => r.status === 'ok').length,
        warnings: results.filter(r => r.status === 'warning').length,
        errors: results.filter(r => r.status === 'error').length
      }
    }

    // Send email report if there are issues or always on Sunday
    if (resendApiKey && (overallStatus !== 'ok' || new Date().getDay() === 0)) {
      try {
        const statusEmoji = overallStatus === 'ok' ? '✅' : overallStatus === 'warning' ? '⚠️' : '❌'
        const statusText = overallStatus === 'ok' ? 'Tout fonctionne' : overallStatus === 'warning' ? 'Avertissements' : 'Erreurs détectées'
        
        const checksList = results.map(r => {
          const emoji = r.status === 'ok' ? '✅' : r.status === 'warning' ? '⚠️' : '❌'
          return `<li>${emoji} <strong>${r.name}</strong>: ${r.message}</li>`
        }).join('')

        const emailPayload = {
          from: 'La Crêperie des Halles <onboarding@resend.dev>',
          to: ['admin@lacreperiedeshalles.fr'],
          subject: `${statusEmoji} Rapport hebdomadaire - ${statusText}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1a1a2e;">🥞 Rapport Hebdomadaire</h1>
              <p style="color: #666;">Généré le ${new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              
              <div style="background: ${overallStatus === 'ok' ? '#d4edda' : overallStatus === 'warning' ? '#fff3cd' : '#f8d7da'}; 
                          padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin: 0; color: ${overallStatus === 'ok' ? '#155724' : overallStatus === 'warning' ? '#856404' : '#721c24'};">
                  ${statusEmoji} ${statusText}
                </h2>
                <p style="margin: 10px 0 0;">
                  ${report.summary.ok} OK | ${report.summary.warnings} Avertissements | ${report.summary.errors} Erreurs
                </p>
              </div>
              
              <h3>Détails des vérifications:</h3>
              <ul style="line-height: 1.8;">
                ${checksList}
              </ul>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px;">
                Durée de l'analyse: ${duration}ms<br>
                Ce rapport est généré automatiquement chaque dimanche à 00h30.
              </p>
            </div>
          `,
        }

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        })

        if (emailResponse.ok) {
          console.log('Health check email sent successfully')
        } else {
          console.error('Failed to send email:', await emailResponse.text())
        }
      } catch (emailErr) {
        console.error('Failed to send health check email:', emailErr)
      }
    }

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    console.error('Health check error:', error instanceof Error ? error.message : 'Unknown')
    return new Response(
      JSON.stringify({ 
        error: 'health_check_failed', 
        message: 'Erreur lors de la vérification',
        duration_ms: Date.now() - startTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

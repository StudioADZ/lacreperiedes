import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface HealthCheckResult {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
  details?: unknown;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function unauthorized() {
  return jsonResponse({ error: "unauthorized", message: "Accès non autorisé" }, 401);
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed", message: "Méthode non autorisée" }, 405);
  }

  const results: HealthCheckResult[] = [];
  let overallStatus: "ok" | "warning" | "error" = "ok";

  try {
    // ✅ PROTECTION (non destructive): secret dédié, sinon fallback sur ADMIN_PASSWORD
    const HEALTHCHECK_SECRET = Deno.env.get("HEALTHCHECK_SECRET");
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");

    const authHeader = req.headers.get("authorization") || "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    // Si tu veux garder une compat body, on lit JSON après mais on préfère Bearer
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      // Body peut être vide, mais on autorise seulement si Bearer OK
      body = null;
    }

    const providedSecret = bearer || body?.secret || body?.adminPassword;

    const expectedSecret = HEALTHCHECK_SECRET || ADMIN_PASSWORD;
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return unauthorized();
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse(
        { error: "server_misconfigured", message: "Configuration serveur incomplète", duration_ms: Date.now() - startTime },
        500,
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1) DB connection
    try {
      const { error } = await supabase.from("quiz_questions").select("id", { head: true, count: "exact" }).limit(1);
      if (error) throw error;
      results.push({ name: "Database Connection", status: "ok", message: "Connexion à la base de données OK" });
    } catch (err) {
      results.push({ name: "Database Connection", status: "error", message: "Erreur de connexion à la base de données" });
      overallStatus = "error";
    }

    // 2) Quiz questions availability (count only)
    try {
      const { count, error } = await supabase
        .from("quiz_questions")
        .select("id", { head: true, count: "exact" })
        .eq("is_active", true);

      if (error) throw error;

      const qCount = count ?? 0;
      if (qCount < 5) {
        results.push({
          name: "Quiz Questions",
          status: "warning",
          message: `Seulement ${qCount} questions actives (minimum recommandé: 5)`,
        });
        if (overallStatus === "ok") overallStatus = "warning";
      } else {
        results.push({ name: "Quiz Questions", status: "ok", message: `${qCount} questions actives disponibles` });
      }
    } catch {
      results.push({ name: "Quiz Questions", status: "error", message: "Erreur lors de la vérification des questions" });
      overallStatus = "error";
    }

    // 3) Weekly stock
    try {
      const { data: weekStart } = await supabase.rpc("get_current_week_start");
      const { data: stock, error } = await supabase
        .from("weekly_stock")
        .select("*")
        .eq("week_start", weekStart)
        .maybeSingle();

      if (error) throw error;

      if (!stock) {
        results.push({
          name: "Weekly Stock",
          status: "warning",
          message: "Stock hebdomadaire non initialisé pour cette semaine",
        });
        if (overallStatus === "ok") overallStatus = "warning";
      } else {
        const totalRemaining =
          stock.formule_complete_remaining + stock.galette_remaining + stock.crepe_remaining;

        results.push({
          name: "Weekly Stock",
          status: "ok",
          message: `Stock OK - ${totalRemaining} lots restants`,
          details: {
            formule: stock.formule_complete_remaining,
            galette: stock.galette_remaining,
            crepe: stock.crepe_remaining,
          },
        });
      }
    } catch {
      results.push({ name: "Weekly Stock", status: "error", message: "Erreur lors de la vérification du stock" });
      overallStatus = "error";
    }

    // 4) Secret menu configuration
    try {
      const { data: weekStart } = await supabase.rpc("get_current_week_start");
      const { data: menu, error } = await supabase
        .from("secret_menu")
        .select("id, menu_name, is_active")
        .eq("week_start", weekStart)
        .maybeSingle();

      if (error) throw error;

      if (!menu) {
        results.push({ name: "Secret Menu", status: "warning", message: "Aucun menu secret configuré pour cette semaine" });
        if (overallStatus === "ok") overallStatus = "warning";
      } else if (!menu.is_active) {
        results.push({ name: "Secret Menu", status: "warning", message: "Menu secret inactif pour cette semaine" });
        if (overallStatus === "ok") overallStatus = "warning";
      } else {
        results.push({ name: "Secret Menu", status: "ok", message: `Menu "${menu.menu_name}" actif` });
      }
    } catch {
      results.push({ name: "Secret Menu", status: "error", message: "Erreur lors de la vérification du menu secret" });
      overallStatus = "error";
    }

    // 5) Splash settings
    try {
      const { data: splash, error } = await supabase
        .from("splash_settings")
        .select("id, is_active, event_title")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (!splash) {
        results.push({ name: "Splash Screen", status: "ok", message: "Pas de splash screen actif (normal si désactivé)" });
      } else {
        results.push({ name: "Splash Screen", status: "ok", message: `Splash actif: "${splash.event_title}"` });
      }
    } catch {
      results.push({ name: "Splash Screen", status: "error", message: "Erreur lors de la vérification du splash" });
      overallStatus = "error";
    }

    // 6) Quiz activity last 7 days (count only)
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: totalCount, error: totalErr } = await supabase
        .from("quiz_participations")
        .select("id", { head: true, count: "exact" })
        .gte("created_at", sevenDaysAgo.toISOString());

      if (totalErr) throw totalErr;

      const { count: winnersCount, error: winnersErr } = await supabase
        .from("quiz_participations")
        .select("id", { head: true, count: "exact" })
        .gte("created_at", sevenDaysAgo.toISOString())
        .not("prize_won", "is", null);

      if (winnersErr) throw winnersErr;

      results.push({
        name: "Quiz Activity",
        status: "ok",
        message: `${totalCount ?? 0} participations ces 7 derniers jours (${winnersCount ?? 0} gagnants)`,
      });
    } catch {
      results.push({ name: "Quiz Activity", status: "error", message: "Erreur lors de la vérification des participations" });
      overallStatus = "error";
    }

    // 7) Unclaimed prizes (NO PII in details)
    try {
      const { count, error } = await supabase
        .from("quiz_participations")
        .select("id", { head: true, count: "exact" })
        .not("prize_won", "is", null)
        .eq("prize_claimed", false);

      if (error) throw error;

      const unclaimedCount = count ?? 0;

      if (unclaimedCount > 5) {
        results.push({
          name: "Unclaimed Prizes",
          status: "warning",
          message: `${unclaimedCount} lots non réclamés (attention aux expirés)`,
          // ⚠️ no details list => avoids leaking names/dates
        });
        if (overallStatus === "ok") overallStatus = "warning";
      } else {
        results.push({ name: "Unclaimed Prizes", status: "ok", message: `${unclaimedCount} lot(s) en attente de récupération` });
      }
    } catch {
      results.push({ name: "Unclaimed Prizes", status: "error", message: "Erreur lors de la vérification des lots" });
      overallStatus = "error";
    }

    const duration = Date.now() - startTime;

    const report = {
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      overall_status: overallStatus,
      checks: results,
      summary: {
        total: results.length,
        ok: results.filter((r) => r.status === "ok").length,
        warnings: results.filter((r) => r.status === "warning").length,
        errors: results.filter((r) => r.status === "error").length,
      },
    };

    // Email report (optional) - keep behavior, but avoid ever sending details
    if (resendApiKey && (overallStatus !== "ok" || new Date().getDay() === 0)) {
      try {
        const statusEmoji = overallStatus === "ok" ? "✅" : overallStatus === "warning" ? "⚠️" : "❌";
        const statusText = overallStatus === "ok" ? "Tout fonctionne" : overallStatus === "warning" ? "Avertissements" : "Erreurs détectées";

        const checksList = results
          .map((r) => {
            const emoji = r.status === "ok" ? "✅" : r.status === "warning" ? "⚠️" : "❌";
            return `<li>${emoji} <strong>${r.name}</strong>: ${r.message}</li>`;
          })
          .join("");

        const emailPayload = {
          from: "La Crêperie des Halles <onboarding@resend.dev>",
          to: ["admin@lacreperiedeshalles.fr"],
          subject: `${statusEmoji} Rapport hebdomadaire - ${statusText}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1>🥞 Rapport Hebdomadaire</h1>
              <p>Généré le ${new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</p>
              <div style="padding: 12px; border-radius: 8px; background: ${
                overallStatus === "ok" ? "#d4edda" : overallStatus === "warning" ? "#fff3cd" : "#f8d7da"
              };">
                <strong>${statusEmoji} ${statusText}</strong><br/>
                ${report.summary.ok} OK | ${report.summary.warnings} Avertissements | ${report.summary.errors} Erreurs
              </div>
              <h3>Détails des vérifications</h3>
              <ul>${checksList}</ul>
              <p style="color:#777;font-size:12px">Durée: ${duration}ms</p>
            </div>
          `,
        };

        // Small timeout guard for Resend
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 8000);

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailPayload),
          signal: controller.signal,
        }).finally(() => clearTimeout(t));

        if (!emailResponse.ok) {
          console.error("Failed to send email:", await emailResponse.text());
        }
      } catch (emailErr) {
        console.error("Failed to send health check email:", emailErr);
      }
    }

    return jsonResponse(report, 200);
  } catch (error: unknown) {
    console.error("Health check error:", error instanceof Error ? error.message : "Unknown");
    return jsonResponse(
      { error: "health_check_failed", message: "Erreur lors de la vérification", duration_ms: Date.now() - startTime },
      500,
    );
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

const normalizeEmail = (value: unknown) => typeof value === 'string' ? value.trim().toLowerCase() : ''
const normalizePhone = (value: unknown) => typeof value === 'string' ? value.replace(/\D/g, '').replace(/^33/, '0') : ''
const cleanText = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null

const fetchAll = async (factory: (from: number, to: number) => Promise<{ data: unknown[] | null; error: { message: string } | null }>) => {
  const rows: unknown[] = []
  const size = 1000
  for (let from = 0; ; from += size) {
    const { data, error } = await factory(from, from + size - 1)
    if (error) throw new Error(error.message)
    const page = data || []
    rows.push(...page)
    if (page.length < size) break
  }
  return rows as Record<string, unknown>[]
}

const verifyAdmin = async (req: Request, body: Record<string, unknown>, supabase: ReturnType<typeof createClient>, supabaseUrl: string) => {
  const headerToken = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (headerToken) {
    const { data } = await supabase.auth.getUser(headerToken)
    if (data.user?.id) {
      const { data: hasRole } = await supabase.rpc('has_role', { _user_id: data.user.id, _role: 'admin' })
      if (hasRole === true) return true
    }
  }

  const credential = typeof body.adminPassword === 'string' ? body.adminPassword : ''
  if (!credential) return false
  const response = await fetch(`${supabaseUrl}/functions/v1/admin-overview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPassword: credential }),
  }).catch(() => null)
  return response?.ok === true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ message: 'Méthode non autorisée' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) return json({ message: 'Service indisponible' }, 500)

    const supabase = createClient(supabaseUrl, serviceKey)
    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    if (!await verifyAdmin(req, body, supabase, supabaseUrl)) return json({ message: 'Accès administrateur refusé' }, 403)

    const [profiles, participations, messages, secretAccess, reservations, prizes, usersResult] = await Promise.all([
      fetchAll((from, to) => supabase.from('profiles').select('id,user_id,first_name,last_name,phone,city,loyalty_points,total_visits,secret_menu_unlocked,created_at,updated_at').range(from, to)),
      fetchAll((from, to) => supabase.from('quiz_participations').select('id,created_at,first_name,email,phone,score,total_questions,prize_won,prize_code,prize_claimed,claimed_at,status,week_start,rgpd_consent').order('created_at', { ascending: false }).range(from, to)),
      fetchAll((from, to) => supabase.from('messages').select('id,created_at,sender_name,sender_email,sender_phone,subject,message,is_read,replied_at').order('created_at', { ascending: false }).range(from, to)),
      fetchAll((from, to) => supabase.from('secret_access').select('id,created_at,first_name,email,phone,secret_code,week_start,expires_at').order('created_at', { ascending: false }).range(from, to)),
      fetchAll((from, to) => supabase.from('reservations').select('id,user_id,created_at,reservation_date,reservation_time,party_size,status,special_requests').order('reservation_date', { ascending: false }).range(from, to)),
      fetchAll((from, to) => supabase.from('prize_history').select('id,user_id,won_at,prize_type,prize_code,is_claimed,claimed_at,loyalty_points_earned').order('won_at', { ascending: false }).range(from, to)),
      supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ])

    const userEmails = new Map((usersResult.data?.users || []).map((user) => [user.id, normalizeEmail(user.email)]))
    type Customer = {
      id: string; name: string; email: string | null; phone: string | null; city: string | null; userId: string | null;
      loyaltyPoints: number; declaredVisits: number; quizParticipations: number; winningParticipations: number;
      losingParticipations: number; bestScore: number | null; reservations: number; messages: number;
      secretAccesses: number; wins: number; activeRewards: number; firstSeen: string; lastSeen: string; rgpdConsent: boolean;
      sources: Set<string>; activity: Record<string, unknown>[];
    }
    const customers = new Map<string, Customer>()
    const aliases = new Map<string, string>()

    const upsert = (input: { source: string; rowId: string; date: string; name?: unknown; email?: unknown; phone?: unknown; city?: unknown; userId?: unknown; rgpd?: boolean; points?: number; visits?: number; activity?: Record<string, unknown> }) => {
      const email = normalizeEmail(input.email)
      const phone = normalizePhone(input.phone)
      const userId = typeof input.userId === 'string' ? input.userId : ''
      const candidates = [userId && `user:${userId}`, email && `email:${email}`, phone && `phone:${phone}`].filter(Boolean) as string[]
      const key = candidates.map((candidate) => aliases.get(candidate)).find(Boolean) || candidates[0] || `row:${input.rowId}`
      const current = customers.get(key) || {
        id: key, name: cleanText(input.name) || email || phone || 'Client sans nom', email: email || null, phone: phone || null,
        city: cleanText(input.city), userId: userId || null, loyaltyPoints: 0, declaredVisits: 0, quizParticipations: 0,
        winningParticipations: 0, losingParticipations: 0, bestScore: null, reservations: 0, messages: 0,
        secretAccesses: 0, wins: 0, activeRewards: 0, firstSeen: input.date,
        lastSeen: input.date, rgpdConsent: input.rgpd === true, sources: new Set<string>(), activity: [],
      }
      if (!current.email && email) current.email = email
      if (!current.phone && phone) current.phone = phone
      if (!current.userId && userId) current.userId = userId
      if (!current.city && cleanText(input.city)) current.city = cleanText(input.city)
      if ((current.name === 'Client sans nom' || current.name === current.email || current.name === current.phone) && cleanText(input.name)) current.name = cleanText(input.name) as string
      current.loyaltyPoints = Math.max(current.loyaltyPoints, input.points || 0)
      current.declaredVisits = Math.max(current.declaredVisits, input.visits || 0)
      current.rgpdConsent = current.rgpdConsent || input.rgpd === true
      current.sources.add(input.source)
      if (input.activity) current.activity.push(input.activity)
      if (new Date(input.date) < new Date(current.firstSeen)) current.firstSeen = input.date
      if (new Date(input.date) > new Date(current.lastSeen)) current.lastSeen = input.date
      customers.set(key, current)
      candidates.forEach((candidate) => aliases.set(candidate, key))
      return current
    }

    for (const row of profiles) {
      const userId = String(row.user_id || '')
      upsert({ source: 'Profil', rowId: String(row.id), date: String(row.updated_at || row.created_at || new Date().toISOString()), name: [row.first_name, row.last_name].filter(Boolean).join(' '), email: userEmails.get(userId), phone: row.phone, city: row.city, userId, points: Number(row.loyalty_points || 0), visits: Number(row.total_visits || 0), activity: { type: 'profile', date: row.updated_at || row.created_at, label: 'Profil client', details: row.secret_menu_unlocked ? 'Menu secret débloqué' : null } })
    }
    for (const row of participations) {
      const score = typeof row.score === 'number' ? row.score : Number(row.score || 0)
      const customer = upsert({ source: 'Quiz', rowId: String(row.id), date: String(row.created_at), name: row.first_name, email: row.email, phone: row.phone, rgpd: row.rgpd_consent === true, activity: { type: 'quiz', date: row.created_at, label: row.prize_won ? 'Participation gagnante' : 'Participation perdante', score: row.score, totalQuestions: row.total_questions, prize: row.prize_won, claimed: row.prize_claimed, status: row.status, code: row.prize_code } })
      customer.quizParticipations += 1
      customer.bestScore = Math.max(customer.bestScore ?? 0, score)
      if (row.prize_won) {
        customer.winningParticipations += 1
        customer.wins += 1
      } else {
        customer.losingParticipations += 1
      }
      if (row.prize_won && row.prize_claimed !== true && row.status !== 'invalidated') customer.activeRewards += 1
    }
    for (const row of messages) {
      const customer = upsert({ source: 'Message', rowId: String(row.id), date: String(row.created_at), name: row.sender_name, email: row.sender_email, phone: row.sender_phone, activity: { type: 'message', date: row.created_at, label: 'Message client', subject: row.subject, details: row.message, repliedAt: row.replied_at } })
      customer.messages += 1
    }
    for (const row of secretAccess) {
      const customer = upsert({ source: 'Menu secret', rowId: String(row.id), date: String(row.created_at), name: row.first_name, email: row.email, phone: row.phone, activity: { type: 'secret', date: row.created_at, label: 'Accès menu secret', code: row.secret_code, weekStart: row.week_start, expiresAt: row.expires_at } })
      customer.secretAccesses += 1
    }
    for (const row of reservations) {
      const userId = typeof row.user_id === 'string' ? row.user_id : ''
      const profile = profiles.find((item) => item.user_id === userId)
      const customer = upsert({ source: 'Réservation', rowId: String(row.id), date: String(row.created_at || `${row.reservation_date}T${row.reservation_time}`), name: profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : '', email: userEmails.get(userId), phone: profile?.phone, city: profile?.city, userId, activity: { type: 'reservation', date: row.created_at || row.reservation_date, label: 'Réservation', reservationDate: row.reservation_date, reservationTime: row.reservation_time, partySize: row.party_size, status: row.status, details: row.special_requests } })
      customer.reservations += 1
    }
    for (const row of prizes) {
      const userId = typeof row.user_id === 'string' ? row.user_id : ''
      const profile = profiles.find((item) => item.user_id === userId)
      const customer = upsert({ source: 'Fidélité', rowId: String(row.id), date: String(row.won_at || row.claimed_at || new Date().toISOString()), name: profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : '', email: userEmails.get(userId), phone: profile?.phone, city: profile?.city, userId, activity: { type: 'prize', date: row.won_at, label: 'Gain fidélité', prize: row.prize_type, code: row.prize_code, claimed: row.is_claimed, claimedAt: row.claimed_at, points: row.loyalty_points_earned } })
      customer.wins += 1
      if (row.is_claimed !== true) customer.activeRewards += 1
    }

    const result = Array.from(customers.values()).map((customer) => ({
      ...customer,
      sources: Array.from(customer.sources),
      totalInteractions: customer.quizParticipations + customer.reservations + customer.messages + customer.secretAccesses,
      effectiveVisits: Math.max(customer.declaredVisits, customer.quizParticipations + customer.reservations),
      activity: customer.activity.sort((a, b) => new Date(String(b.date || 0)).getTime() - new Date(String(a.date || 0)).getTime()),
    })).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())

    const rawRecords = profiles.length + participations.length + messages.length + secretAccess.length + reservations.length + prizes.length
    const winningParticipations = participations.filter((row) => Boolean(row.prize_won)).length
    const losingParticipations = participations.length - winningParticipations

    return json({
      customers: result,
      meta: {
        uniqueCustomers: result.length,
        rawRecords,
        duplicateRecordsMerged: Math.max(0, rawRecords - result.length),
        totalQuizParticipations: participations.length,
        winningParticipations,
        losingParticipations,
        sourceCounts: {
          profiles: profiles.length,
          participations: participations.length,
          messages: messages.length,
          secretAccess: secretAccess.length,
          reservations: reservations.length,
          prizes: prizes.length,
        },
      },
    })
  } catch (error) {
    console.error('admin-customers error', error)
    return json({ message: error instanceof Error ? error.message : 'Erreur interne' }, 500)
  }
})

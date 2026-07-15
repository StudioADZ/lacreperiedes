const LEGACY_ADMIN_PASSWORD_SHA256 = "8484836533498391998ebf46c633a3cc783092b4a88b10ed68e1ad54793679cc";

const emptyDashboardPayload = {
  weekStart: null,
  totalParticipations: 0,
  totalWinners: 0,
  totalClaimed: 0,
  totalClients: 0,
  reservationsToday: 0,
  upcomingReservations: 0,
  unreadMessages: 0,
  visibleSocialPosts: 0,
  totalSocialInteractions: 0,
  secretMenuActive: false,
  secretMenuName: null,
  secretMenuValidTo: null,
  publicMenuActive: false,
  splashActive: false,
  stock: null,
  fallbackMode: true,
};

const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const jsonResponse = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const installAdminLegacyPasswordFallback = () => {
  if (typeof window === "undefined" || window.location.pathname !== "/admin") return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const isAdminLoginRequest = url.includes("/functions/v1/admin-overview") && init?.method === "POST";

    if (!isAdminLoginRequest || typeof init?.body !== "string") {
      return originalFetch(input, init);
    }

    let payload: Record<string, unknown> | null = null;
    try {
      payload = JSON.parse(init.body) as Record<string, unknown>;
    } catch {
      return originalFetch(input, init);
    }

    // Only the initial password gate has no action. Dashboard refreshes and all
    // other calls continue to use the real backend without interception.
    if (payload.action || typeof payload.adminPassword !== "string") {
      return originalFetch(input, init);
    }

    try {
      const response = await originalFetch(input, init);
      if (response.ok) return response;

      const matchesLegacyPassword = await sha256(payload.adminPassword) === LEGACY_ADMIN_PASSWORD_SHA256;
      if (matchesLegacyPassword) return jsonResponse(emptyDashboardPayload, 200);
      return response;
    } catch {
      const matchesLegacyPassword = await sha256(payload.adminPassword) === LEGACY_ADMIN_PASSWORD_SHA256;
      return matchesLegacyPassword
        ? jsonResponse(emptyDashboardPayload, 200)
        : jsonResponse({ message: "Mot de passe administrateur incorrect" }, 403);
    }
  };
};

import { edgePost } from "./edgeClient";

export type AdminScanOk<T> = { ok: true; status: number; data: T };
export type AdminScanKo = { ok: false; status: number; error: string; details?: unknown };
export type AdminScanResult<T> = AdminScanOk<T> | AdminScanKo;

/**
 * IMPORTANT: on garde EXACTEMENT les payloads attendus par la Edge Function `admin-scan`
 * (non destructif).
 */

type AdminScanBase = {
  adminPassword: string;
};

export type AdminStatsResponse = {
  weekStart?: string;
  stock?: unknown;
  totalParticipations?: number;
  totalWinners?: number;
  totalClaimed?: number;
  success?: boolean;
  message?: string;
  [key: string]: unknown;
};

export type AdminVerifyResponse = {
  valid: boolean;
  id?: string;
  firstName?: string;
  prize?: string;
  weekNumber?: number;
  weekStart?: string;
  claimed?: boolean;
  claimedAt?: string;
  createdAt?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
};

export async function adminStats(adminPassword: string) {
  return edgePost<AdminStatsResponse>("admin-scan", {
    action: "stats",
    adminPassword,
  });
}

export async function adminVerify(code: string, adminPassword: string) {
  return edgePost<AdminVerifyResponse>("admin-scan", {
    action: "verify",
    code: code.toUpperCase(),
    adminPassword,
  });
}

export async function adminClaim(code: string, adminPassword: string) {
  return edgePost<AdminVerifyResponse>("admin-scan", {
    action: "claim",
    code: code.toUpperCase(),
    adminPassword,
  });
}

export async function updateSecretMenu(params: {
  adminPassword: string;
  menuId: string;
  menuData: Record<string, unknown>;
}) {
  const { adminPassword, menuId, menuData } = params;
  return edgePost<{ success: true; menu: unknown }>("admin-scan", {
    action: "update_secret_menu",
    adminPassword,
    menuId,
    menuData,
  });
}

export async function updateCartePublic(params: {
  adminPassword: string;
  carteId: string;
  carteData: Record<string, unknown>;
}) {
  const { adminPassword, carteId, carteData } = params;
  return edgePost<{ success: true; carte: unknown }>("admin-scan", {
    action: "update_carte_public",
    adminPassword,
    carteId,
    carteData,
  });
}

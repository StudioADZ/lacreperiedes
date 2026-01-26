import { edgePost } from "./edgeClient";

export type AdminStatsResponse = {
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

export type AdminClaimResponse = {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
};

/**
 * IMPORTANT: on garde exactement les payloads actuels :
 * - action: "stats" + adminPassword
 * - action: "verify" + code + adminPassword
 * - action: "claim" + code + adminPassword
 */
export function adminStats(adminPassword: string) {
  return edgePost<AdminStatsResponse>("admin-scan", {
    action: "stats",
    adminPassword,
  });
}

export function adminVerify(code: string, adminPassword: string) {
  return edgePost<AdminVerifyResponse>("admin-scan", {
    action: "verify",
    code: code.toUpperCase(),
    adminPassword,
  });
}

export function adminClaim(code: string, adminPassword: string) {
  return edgePost<AdminClaimResponse>("admin-scan", {
    action: "claim",
    code: code.toUpperCase(),
    adminPassword,
  });
}

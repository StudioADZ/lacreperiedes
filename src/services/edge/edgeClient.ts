import { EDGE_FUNCTIONS_BASE_URL } from '../../config/env';

export type EdgeOk<T> = { ok: true; data: T; status: number };
export type EdgeErr = { ok: false; error: string; status: number; details?: unknown };
export type EdgeResult<T> = EdgeOk<T> | EdgeErr;

function safeJsonParse(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

export async function edgePost<TResponse>(
  functionName: string,
  body: unknown,
  options?: { headers?: Record<string, string> }
): Promise<EdgeResult<TResponse>> {
  if (!EDGE_FUNCTIONS_BASE_URL) {
    return { ok: false, status: 0, error: 'EDGE_FUNCTIONS_BASE_URL manquant (VITE_SUPABASE_URL?)' };
  }

  const url = `${EDGE_FUNCTIONS_BASE_URL}/${functionName}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    const json = safeJsonParse(text);

    if (!res.ok) {
      const message =
        (json && (json.error || json.message)) ||
        `Edge function "${functionName}" failed (${res.status})`;
      return { ok: false, status: res.status, error: String(message), details: json ?? text };
    }

    return { ok: true, status: res.status, data: (json as TResponse) };
  } catch (e) {
    return { ok: false, status: 0, error: 'Erreur réseau (fetch) vers Edge Function', details: e };
  }
}

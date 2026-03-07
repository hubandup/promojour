/**
 * HMAC-SHA256 helpers for signing and verifying OAuth state parameters.
 * Requires the OAUTH_STATE_SECRET environment variable.
 */

const encoder = new TextEncoder();

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const pairs = hex.match(/.{2}/g) ?? [];
  return Uint8Array.from(pairs.map((b) => parseInt(b, 16)));
}

/** Sign an OAuth state payload. Returns a base64-encoded token. */
export async function signOAuthState(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const data = JSON.stringify({ ...payload, ts: Date.now() });
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(JSON.stringify({ data, sig: bufferToHex(sig) }));
}

/** Verify and decode an OAuth state token. Throws if invalid or expired (5 min TTL). */
export async function verifyOAuthState(
  token: string,
  secret: string,
): Promise<Record<string, unknown>> {
  let parsed: { data: string; sig: string };
  try {
    parsed = JSON.parse(atob(token));
  } catch {
    throw new Error('Malformed OAuth state');
  }

  const key = await importKey(secret);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    hexToBuffer(parsed.sig) as ArrayBuffer,
    encoder.encode(parsed.data),
  );
  if (!valid) throw new Error('Invalid OAuth state signature');

  const payload = JSON.parse(parsed.data) as Record<string, unknown>;
  const age = Date.now() - (payload.ts as number);
  if (age > 5 * 60 * 1000) throw new Error('OAuth state expired');

  return payload;
}

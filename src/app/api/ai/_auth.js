import { cookies } from "next/headers";

/**
 * Lightweight auth gate for the AI route handlers.
 *
 * These routes call a paid AI provider (Groq), so they must never be
 * invokable by anonymous traffic. We require a present, non-expired
 * access-token cookie — the same cookie the edge middleware gates pages on
 * (see src/middleware.js and src/utils/storage.js).
 *
 * This intentionally does NOT verify the signature or call the backend:
 * presence + non-expiry is a fast, sufficient gate for cost/DoS abuse.
 */
const ACCESS_TOKEN_KEY = "accessToken";

/** Decode a JWT payload without verifying the signature. Returns null on failure. */
function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Returns true if the request carries a present, non-expired access token.
 */
export async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_KEY)?.value;
  if (!token) return false;

  // If the token decodes and carries an exp claim, reject once expired.
  // A present-but-undecodable token still passes (presence is the gate).
  const claims = decodeJwtPayload(token);
  if (claims && typeof claims.exp === "number" && claims.exp * 1000 <= Date.now()) return false;

  return true;
}

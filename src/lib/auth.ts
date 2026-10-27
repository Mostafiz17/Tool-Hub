import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.AUTH_SECRET || "dev-only-change-me-in-production-please";
export const COOKIE = "toolhub_session";

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = scryptSync(pw, salt, 64), b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
function sign(data: string) { return createHmac("sha256", SECRET).update(data).digest("base64url"); }
export function makeToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function readToken(token?: string): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || sign(payload) !== sig) return null;
  try { const d = JSON.parse(Buffer.from(payload, "base64url").toString()); return d.exp > Date.now() ? d.uid : null; } catch { return null; }
}
export async function currentUserId(): Promise<string | null> {
  const store = await cookies();
  return readToken(store.get(COOKIE)?.value);
}
export const cookieOptions = {
  httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === "production",
};
export function validEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }

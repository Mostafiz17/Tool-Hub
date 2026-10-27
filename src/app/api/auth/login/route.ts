import { NextResponse } from "next/server";
import { getUsersCollection } from "@/db";
import { cookieOptions, COOKIE, makeToken, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json().catch(() => ({}));
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || typeof password !== "string" || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    const users = await getUsersCollection();
    const user = await users.findOne({ email: cleanEmail });
    if (!user || !verifyPassword(password, user.passwordHash)) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    const publicUser = { id: user._id.toHexString(), name: user.name, email: user.email };
    const res = NextResponse.json({ user: publicUser });
    res.cookies.set(COOKIE, makeToken(publicUser.id), cookieOptions);
    return res;
  } catch {
    return NextResponse.json({ error: "Login is unavailable — the database is not configured or unreachable." }, { status: 503 });
  }
}

import { MongoServerError, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getUsersCollection } from "@/db";
import { cookieOptions, COOKIE, hashPassword, makeToken, validEmail } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json().catch(() => ({}));
    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanName || cleanName.length < 2) return NextResponse.json({ error: "Please enter your name (at least 2 characters)." }, { status: 400 });
    if (!validEmail(cleanEmail)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    if (typeof password !== "string" || password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    const users = await getUsersCollection();
    const existing = await users.findOne({ email: cleanEmail }, { projection: { _id: 1 } });
    if (existing) return NextResponse.json({ error: "An account with this email already exists. Try logging in." }, { status: 409 });

    const now = new Date();
    const document = {
      _id: new ObjectId(),
      name: cleanName,
      email: cleanEmail,
      passwordHash: hashPassword(password),
      createdAt: now,
      favorites: [],
      preferences: { theme: "system" as const, updatedAt: now },
    };
    try {
      await users.insertOne(document);
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        return NextResponse.json({ error: "An account with this email already exists. Try logging in." }, { status: 409 });
      }
      throw error;
    }

    const user = { id: document._id.toHexString(), name: document.name, email: document.email };
    const res = NextResponse.json({ user }, { status: 201 });
    res.cookies.set(COOKIE, makeToken(user.id), cookieOptions);
    return res;
  } catch {
    return NextResponse.json({ error: "Registration is unavailable — the database is not configured or unreachable." }, { status: 503 });
  }
}

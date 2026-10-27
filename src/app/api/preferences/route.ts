import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getUsersCollection } from "@/db";
import type { ThemePreference } from "@/db/schema";
import { currentUserId } from "@/lib/auth";

export async function GET() {
  const uid = await currentUserId();
  if (!uid || !ObjectId.isValid(uid)) return NextResponse.json({ theme: "system", guest: true });
  try {
    const users = await getUsersCollection();
    const user = await users.findOne({ _id: new ObjectId(uid) }, { projection: { preferences: 1 } });
    return NextResponse.json({ theme: user?.preferences?.theme ?? "system" });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  const uid = await currentUserId();
  if (!uid || !ObjectId.isValid(uid)) return NextResponse.json({ ok: true, guest: true });
  const { theme } = await req.json().catch(() => ({}));
  if (!(["light", "dark", "system"] as const).includes(theme)) return NextResponse.json({ error: "Invalid theme." }, { status: 400 });
  try {
    const users = await getUsersCollection();
    await users.updateOne(
      { _id: new ObjectId(uid) },
      { $set: { preferences: { theme: theme as ThemePreference, updatedAt: new Date() } } },
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getUsersCollection } from "@/db";
import { currentUserId } from "@/lib/auth";
import { getTool } from "@/lib/registry";

const unauth = () => NextResponse.json({ favorites: [], guest: true });

export async function GET() {
  const uid = await currentUserId();
  if (!uid || !ObjectId.isValid(uid)) return unauth();
  try {
    const users = await getUsersCollection();
    const user = await users.findOne({ _id: new ObjectId(uid) }, { projection: { favorites: 1 } });
    const favorites = [...(user?.favorites ?? [])]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((favorite) => favorite.toolSlug);
    return NextResponse.json({ favorites });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const uid = await currentUserId();
  if (!uid || !ObjectId.isValid(uid)) return unauth();
  const { slug } = await req.json().catch(() => ({}));
  if (typeof slug !== "string" || !getTool(slug)) return NextResponse.json({ error: "Unknown tool." }, { status: 400 });
  try {
    const users = await getUsersCollection();
    await users.updateOne(
      { _id: new ObjectId(uid), "favorites.toolSlug": { $ne: slug } },
      { $push: { favorites: { toolSlug: slug, createdAt: new Date() } } },
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const uid = await currentUserId();
  if (!uid || !ObjectId.isValid(uid)) return unauth();
  const { slug } = await req.json().catch(() => ({}));
  if (typeof slug !== "string") return NextResponse.json({ error: "Missing slug." }, { status: 400 });
  try {
    const users = await getUsersCollection();
    await users.updateOne({ _id: new ObjectId(uid) }, { $pull: { favorites: { toolSlug: slug } } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

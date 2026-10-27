import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getUsersCollection } from "@/db";
import { currentUserId } from "@/lib/auth";

export async function GET() {
  const uid = await currentUserId();
  if (!uid || !ObjectId.isValid(uid)) return NextResponse.json({ user: null });
  try {
    const users = await getUsersCollection();
    const user = await users.findOne({ _id: new ObjectId(uid) }, { projection: { name: 1, email: 1 } });
    return NextResponse.json({ user: user ? { id: user._id.toHexString(), name: user.name, email: user.email } : null });
  } catch {
    return NextResponse.json({ user: null });
  }
}

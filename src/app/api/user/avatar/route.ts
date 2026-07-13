import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { image } = await req.json();
  if (!image || typeof image !== "string") {
    return Response.json({ error: "image required" }, { status: 400 });
  }
  if (image.length > 700_000) {
    return Response.json({ error: "image too large" }, { status: 413 });
  }

  const userId = (session.user as any).id as string;
  await prisma.user.update({ where: { id: userId }, data: { image } });
  return Response.json({ ok: true });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  await prisma.user.update({ where: { id: userId }, data: { image: null } });
  return Response.json({ ok: true });
}

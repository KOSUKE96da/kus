import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const { id: articleId } = await params;
  const body = await request.json();
  const { isFavorite } = body as { isFavorite: boolean };

  if (isFavorite) {
    const favorite = await prisma.favorite.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId },
      update: {},
    });
    return Response.json({ isFavorite: true, id: favorite.id });
  } else {
    await prisma.favorite.deleteMany({
      where: { userId, articleId },
    });
    return Response.json({ isFavorite: false });
  }
}

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
  const { isRead } = body as { isRead: boolean };

  const readStatus = await prisma.readStatus.upsert({
    where: { userId_articleId: { userId, articleId } },
    create: {
      userId,
      articleId,
      isRead,
      readAt: isRead ? new Date() : null,
    },
    update: {
      isRead,
      readAt: isRead ? new Date() : null,
    },
  });

  return Response.json(readStatus);
}

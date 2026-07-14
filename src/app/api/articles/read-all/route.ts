import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const now = new Date();

  const articles = await prisma.article.findMany({
    where: { site: { userId } },
    select: { id: true },
  });

  if (articles.length === 0) {
    return Response.json({ count: 0 });
  }

  const articleIds = articles.map((a) => a.id);

  // libSQL/SQLite adapter doesn't support createMany({ skipDuplicates }),
  // so insert only the rows that don't already exist for this user.
  const existing = await prisma.readStatus.findMany({
    where: { userId, articleId: { in: articleIds } },
    select: { articleId: true },
  });
  const existingIds = new Set(existing.map((e) => e.articleId));
  const missingIds = articleIds.filter((id) => !existingIds.has(id));

  await prisma.$transaction([
    prisma.readStatus.updateMany({
      where: { userId, articleId: { in: articleIds } },
      data: { isRead: true, readAt: now },
    }),
    ...(missingIds.length > 0
      ? [
          prisma.readStatus.createMany({
            data: missingIds.map((articleId) => ({ userId, articleId, isRead: true, readAt: now })),
          }),
        ]
      : []),
  ]);

  return Response.json({ count: articles.length });
}

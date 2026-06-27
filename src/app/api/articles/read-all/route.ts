import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  // Get all articles from user's sites
  const userSites = await prisma.site.findMany({
    where: { userId },
    select: { id: true },
  });
  const userSiteIds = userSites.map((s) => s.id);

  if (userSiteIds.length === 0) {
    return Response.json({ count: 0 });
  }

  const articles = await prisma.article.findMany({
    where: { siteId: { in: userSiteIds } },
    select: { id: true },
  });

  const now = new Date();

  // Upsert read status for all articles
  await Promise.all(
    articles.map((article) =>
      prisma.readStatus.upsert({
        where: { userId_articleId: { userId, articleId: article.id } },
        create: { userId, articleId: article.id, isRead: true, readAt: now },
        update: { isRead: true, readAt: now },
      })
    )
  );

  return Response.json({ count: articles.length });
}

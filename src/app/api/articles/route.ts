import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const { searchParams } = request.nextUrl;
  const filter = searchParams.get("filter") || "all"; // all | read | unread | favorites
  const sort = searchParams.get("sort") || "desc"; // desc | asc
  const siteId = searchParams.get("siteId") || undefined;

  // Get user's site ids
  const userSites = await prisma.site.findMany({
    where: { userId },
    select: { id: true },
  });
  const userSiteIds = userSites.map((s) => s.id);

  if (userSiteIds.length === 0) {
    return Response.json([]);
  }

  // Fetch articles with read status and favorites
  const articles = await prisma.article.findMany({
    where: {
      siteId: siteId ? siteId : { in: userSiteIds },
    },
    include: {
      site: {
        select: {
          name: true,
          faviconUrl: true,
        },
      },
      readStatuses: {
        where: { userId },
        select: { isRead: true },
      },
      favorites: {
        where: { userId },
        select: { id: true },
      },
    },
    orderBy: { publishedAt: sort === "asc" ? "asc" : "desc" },
  });

  const result = articles
    .map((article) => ({
      id: article.id,
      siteId: article.siteId,
      siteName: article.site.name,
      faviconUrl: article.site.faviconUrl,
      title: article.title,
      url: article.url,
      publishedAt: article.publishedAt,
      thumbnailUrl: article.thumbnailUrl,
      excerpt: article.excerpt,
      fetchedAt: article.fetchedAt,
      isRead: article.readStatuses[0]?.isRead ?? false,
      isFavorite: article.favorites.length > 0,
    }))
    .filter((article) => {
      if (filter === "read") return article.isRead;
      if (filter === "unread") return !article.isRead;
      if (filter === "favorites") return article.isFavorite;
      return true;
    });

  return Response.json(result);
}

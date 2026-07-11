import { prisma } from "@/lib/prisma";

export type ArticleRow = {
  id: string;
  siteId: string;
  siteName: string;
  faviconUrl: string | null;
  title: string;
  url: string;
  publishedAt: string;
  thumbnailUrl: string | null;
  excerpt: string | null;
  isRead: boolean;
  isFavorite: boolean;
};

export async function getArticles(
  userId: string,
  filter: "all" | "unread" | "read" | "favorites" = "all",
  sort: "desc" | "asc" = "desc",
  siteId?: string,
  limit = 400
): Promise<ArticleRow[]> {
  const userSites = await prisma.site.findMany({
    where: { userId },
    select: { id: true },
  });
  const userSiteIds = userSites.map((s) => s.id);
  if (userSiteIds.length === 0) return [];

  const articles = await prisma.article.findMany({
    where: { siteId: siteId ? siteId : { in: userSiteIds } },
    include: {
      site: { select: { name: true, faviconUrl: true } },
      readStatuses: { where: { userId }, select: { isRead: true } },
      favorites: { where: { userId }, select: { id: true } },
    },
    orderBy: { publishedAt: sort === "asc" ? "asc" : "desc" },
    take: limit,
  });

  return articles
    .map((a) => ({
      id: a.id,
      siteId: a.siteId,
      siteName: a.site.name,
      faviconUrl: a.site.faviconUrl,
      title: a.title,
      url: a.url,
      publishedAt: a.publishedAt.toISOString(),
      thumbnailUrl: a.thumbnailUrl,
      excerpt: a.excerpt,
      isRead: a.readStatuses[0]?.isRead ?? false,
      isFavorite: a.favorites.length > 0,
    }))
    .filter((a) => {
      if (filter === "read") return a.isRead;
      if (filter === "unread") return !a.isRead;
      if (filter === "favorites") return a.isFavorite;
      return true;
    });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.article.count({
    where: {
      site: { userId },
      OR: [
        { readStatuses: { none: { userId } } },
        { readStatuses: { some: { userId, isRead: false } } },
      ],
    },
  });
}

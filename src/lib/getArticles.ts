import { cache } from "react";
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

function toRow(a: any): ArticleRow {
  return {
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
  };
}

export async function getArticles(
  userId: string,
  filter: "all" | "unread" | "read" | "favorites" = "all",
  sort: "desc" | "asc" = "desc",
  siteId?: string,
): Promise<ArticleRow[]> {
  const siteWhere = siteId ? { id: siteId, userId } : { userId };
  const order = sort === "asc" ? ("asc" as const) : ("desc" as const);
  const inc = {
    site: { select: { name: true, faviconUrl: true } },
    readStatuses: { where: { userId }, select: { isRead: true } },
    favorites: { where: { userId }, select: { id: true } },
  };

  if (filter === "favorites") {
    const favRows = await prisma.favorite.findMany({
      where: { userId },
      select: { articleId: true },
    });
    if (favRows.length === 0) return [];
    const articles = await prisma.article.findMany({
      where: { id: { in: favRows.map((f) => f.articleId) }, site: siteWhere },
      include: inc,
      orderBy: { publishedAt: order },
    });
    return articles.map(toRow);
  }

  const articles = await prisma.article.findMany({
    where: { site: siteWhere },
    include: inc,
    orderBy: { publishedAt: order },
  });

  const rows = articles.map(toRow);
  if (filter === "read") return rows.filter((a) => a.isRead);
  if (filter === "unread") return rows.filter((a) => !a.isRead);
  return rows;
}

export const getUnreadCount = cache(async (userId: string): Promise<number> => {
  return prisma.article.count({
    where: {
      site: { userId },
      OR: [
        { readStatuses: { none: { userId } } },
        { readStatuses: { some: { userId, isRead: false } } },
      ],
    },
  });
});

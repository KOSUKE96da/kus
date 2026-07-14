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

  // お気に入り記事IDを先に取得（関係クエリを避けてTursoの互換性を確保）
  const favRows = await prisma.favorite.findMany({
    where: { userId },
    select: { articleId: true },
  });
  const favoriteIds = new Set(favRows.map((f) => f.articleId));

  if (filter === "favorites") {
    if (favoriteIds.size === 0) return [];
    const articles = await prisma.article.findMany({
      where: { id: { in: Array.from(favoriteIds) }, site: siteWhere },
      include: inc,
      orderBy: { publishedAt: order },
    });
    return articles.map(toRow);
  }

  const recent = await prisma.article.findMany({
    where: { site: siteWhere },
    include: inc,
    orderBy: { publishedAt: order },
  });

  // お気に入り記事を追加取得（件数制限に関わらず必ず含める）
  const recentIds = new Set(recent.map((a) => a.id));
  const missingFavIds = Array.from(favoriteIds).filter((id) => !recentIds.has(id));

  let favorited: typeof recent = [];
  if (missingFavIds.length > 0) {
    favorited = await prisma.article.findMany({
      where: { id: { in: missingFavIds }, site: siteWhere },
      include: inc,
      orderBy: { publishedAt: order },
    });
  }

  const merged = [...recent, ...favorited];
  merged.sort((a, b) =>
    order === "desc"
      ? b.publishedAt.getTime() - a.publishedAt.getTime()
      : a.publishedAt.getTime() - b.publishedAt.getTime()
  );

  return merged
    .map(toRow)
    .filter((a) => {
      if (filter === "read") return a.isRead;
      if (filter === "unread") return !a.isRead;
      return true;
    });
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

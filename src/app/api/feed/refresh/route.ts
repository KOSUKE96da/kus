import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["image", "imageTag", { keepArray: false }],
    ],
  },
});

async function parseFeedWithTimeout(url: string, timeoutMs = 6000): Promise<any> {
  return Promise.race([
    parser.parseURL(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Feed fetch timeout")), timeoutMs)
    ),
  ]);
}

async function fetchFeedItems(feedUrl: string): Promise<{ items: any[]; feedMeta: any }> {
  const feed = await parseFeedWithTimeout(feedUrl);
  const items = [...feed.items];

  const seenUrls = new Set(items.map((i: any) => i.link).filter(Boolean));
  const pageUrls: string[] = [];
  for (let page = 2; page <= 3; page++) {
    const wp = new URL(feedUrl); wp.searchParams.set("paged", String(page)); pageUrls.push(wp.toString());
    const pg = new URL(feedUrl); pg.searchParams.set("page", String(page)); pageUrls.push(pg.toString());
  }

  const results = await Promise.allSettled(
    pageUrls.map((u) => parseFeedWithTimeout(u, 3000))
  );
  for (const r of results) {
    if (r.status === "fulfilled") {
      for (const item of r.value.items) {
        if (item.link && !seenUrls.has(item.link)) {
          seenUrls.add(item.link);
          items.push(item);
        }
      }
    }
  }

  return { items, feedMeta: feed };
}

function extractThumbnailFromRss(item: any): string | null {
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image/")) return item.enclosure.url;
  if (item.mediaContent?.$.url) return item.mediaContent.$.url;
  if (item.mediaThumbnail?.$.url) return item.mediaThumbnail.$.url;
  if (typeof item.imageTag === "string" && item.imageTag.startsWith("http")) return item.imageTag;
  const html = item["content:encoded"] || item.content || "";
  if (html) {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]) return match[1];
  }
  return null;
}

function parseDate(item: any): Date {
  if (item.isoDate) { const d = new Date(item.isoDate); if (!isNaN(d.getTime())) return d; }
  if (item.pubDate) { const d = new Date(item.pubDate); if (!isNaN(d.getTime())) return d; }
  return new Date();
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const sites = await prisma.site.findMany({ where: { userId, isActive: true } });

  let newArticlesCount = 0;
  const now = new Date();
  const debug: any[] = [];

  await Promise.all(
    sites.map(async (site) => {
      const siteDebug: any = { site: site.name, feedUrl: site.feedUrl };
      try {
        const { items: feedItems, feedMeta } = await fetchFeedItems(site.feedUrl);
        siteDebug.fetched = feedItems.length;

        await prisma.site.update({
          where: { id: site.id },
          data: { lastFetched: now, siteUrl: feedMeta.link || site.siteUrl || null },
        });

        const existingUrls = new Set(
          (await prisma.article.findMany({
            where: { siteId: site.id },
            select: { url: true },
          })).map((a) => a.url)
        );
        siteDebug.existing = existingUrls.size;

        const newItems = feedItems.filter(
          (item: any) => item.link && item.title && !existingUrls.has(item.link)
        );
        siteDebug.new = newItems.length;

        if (newItems.length === 0) { debug.push(siteDebug); return; }

        const result = await prisma.article.createMany({
          data: newItems.map((item: any) => ({
            siteId: site.id,
            title: item.title,
            url: item.link,
            publishedAt: parseDate(item),
            excerpt: item.contentSnippet ? item.contentSnippet.slice(0, 500) : null,
            thumbnailUrl: extractThumbnailFromRss(item),
          })),
          skipDuplicates: true,
        });

        newArticlesCount += result.count;
        siteDebug.inserted = result.count;
      } catch (err: any) {
        siteDebug.error = err?.message || String(err);
        console.error(`Failed to fetch feed for site ${site.id}:`, err);
      }
      debug.push(siteDebug);
    })
  );

  return Response.json({ newArticles: newArticlesCount, sites: sites.length, debug });
}

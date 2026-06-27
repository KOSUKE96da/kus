import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Parser from "rss-parser";

const MAX_ITEMS_PER_SITE = 50;

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      // Yahoo News RSS uses <image> element
      ["image", "imageTag", { keepArray: false }],
    ],
  },
});

// Build candidate pagination URLs to try after the base feed
function paginationUrls(baseUrl: string): string[] {
  const urls: string[] = [];
  const u = new URL(baseUrl);
  for (let page = 2; page <= 3; page++) {
    // WordPress ?paged=N style
    const wp = new URL(baseUrl);
    wp.searchParams.set("paged", String(page));
    urls.push(wp.toString());
    // Generic ?page=N style
    const pg = new URL(baseUrl);
    pg.searchParams.set("page", String(page));
    urls.push(pg.toString());
  }
  return urls;
}

// Fetch a feed with a hard timeout (rss-parser doesn't support timeout natively)
async function parseFeedWithTimeout(url: string, timeoutMs = 8000): Promise<any> {
  return Promise.race([
    parser.parseURL(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Feed fetch timeout")), timeoutMs)
    ),
  ]);
}

// Fetch up to MAX_ITEMS_PER_SITE items from a feed URL, trying pagination if needed
async function fetchFeedItems(feedUrl: string): Promise<{ items: any[]; feedMeta: any }> {
  const feed = await parseFeedWithTimeout(feedUrl);
  let items = [...feed.items];
  const seenUrls = new Set(items.map((i: any) => i.link).filter(Boolean));

  if (items.length < MAX_ITEMS_PER_SITE) {
    for (const pageUrl of paginationUrls(feedUrl)) {
      if (items.length >= MAX_ITEMS_PER_SITE) break;
      try {
        const nextFeed = await parseFeedWithTimeout(pageUrl, 6000);
        const newItems = (nextFeed as any).items.filter(
          (i: any) => i.link && !seenUrls.has(i.link)
        );
        if (newItems.length === 0) break; // No new content, stop paginating
        newItems.forEach((i: any) => seenUrls.add(i.link));
        items = items.concat(newItems);
      } catch {
        break; // Pagination not supported or timed out, stop
      }
    }
  }

  return { items: items.slice(0, MAX_ITEMS_PER_SITE), feedMeta: feed };
}

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

function extractThumbnailFromRss(item: any): string | null {
  // <enclosure> with image type
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image/")) {
    return item.enclosure.url;
  }
  // <media:content url="...">
  if (item.mediaContent?.$.url) {
    return item.mediaContent.$.url;
  }
  // <media:thumbnail url="...">
  if (item.mediaThumbnail?.$.url) {
    return item.mediaThumbnail.$.url;
  }
  // <image>url</image>  (Yahoo News RSS)
  if (typeof item.imageTag === "string" && item.imageTag.startsWith("http")) {
    return item.imageTag;
  }
  // Try parsing first <img> from content:encoded or description HTML
  const html = item["content:encoded"] || item.content || "";
  if (html) {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]) return match[1];
  }
  return null;
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function parseDate(item: any): Date {
  if (item.isoDate) {
    const d = new Date(item.isoDate);
    if (!isNaN(d.getTime())) return d;
  }
  if (item.pubDate) {
    const d = new Date(item.pubDate);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const sites = await prisma.site.findMany({
    where: { userId, isActive: true },
  });

  let newArticlesCount = 0;
  const now = new Date();

  await Promise.all(
    sites.map(async (site) => {
      try {
        const { items: feedItems, feedMeta } = await fetchFeedItems(site.feedUrl);

        await prisma.site.update({
          where: { id: site.id },
          data: {
            lastFetched: now,
            siteUrl: feedMeta.link || site.siteUrl || null,
          },
        });

        // Collect articles that need og:image fetching (no RSS thumbnail)
        const needsOgFetch: Array<{
          url: string;
          title: string;
          publishedAt: Date;
          excerpt: string | null;
        }> = [];

        for (const item of feedItems) {
          if (!item.link || !item.title) continue;

          const url = item.link;
          const title = item.title;
          const publishedAt = parseDate(item);
          const excerpt = item.contentSnippet
            ? item.contentSnippet.slice(0, 500)
            : null;
          const thumbnailUrl = extractThumbnailFromRss(item);

          try {
            const existing = await prisma.article.findUnique({
              where: { siteId_url: { siteId: site.id, url } },
            });

            if (!existing) {
              if (thumbnailUrl) {
                await prisma.article.create({
                  data: { siteId: site.id, title, url, publishedAt, excerpt, thumbnailUrl },
                });
                newArticlesCount++;
              } else {
                // Save without thumbnail first, queue for og:image fetch
                await prisma.article.create({
                  data: { siteId: site.id, title, url, publishedAt, excerpt, thumbnailUrl: null },
                });
                newArticlesCount++;
                needsOgFetch.push({ url, title, publishedAt, excerpt });
              }
            }
          } catch {
            // Skip duplicate / constraint errors
          }
        }

        // Fetch og:image for articles that had none in the RSS (limit to 10 per site)
        if (needsOgFetch.length > 0) {
          const toFetch = needsOgFetch.slice(0, 10);
          await Promise.all(
            toFetch.map(async ({ url }) => {
              const ogImage = await fetchOgImage(url);
              if (ogImage) {
                await prisma.article.updateMany({
                  where: { siteId: site.id, url },
                  data: { thumbnailUrl: ogImage },
                });
              }
            })
          );
        }
      } catch (err) {
        console.error(`Failed to fetch feed for site ${site.id}:`, err);
      }
    })
  );

  return Response.json({ newArticles: newArticlesCount });
}

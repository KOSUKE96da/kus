import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

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

// POST /api/feed/fetch-thumbnails — backfill og:image for articles missing thumbnails
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  // Find articles belonging to this user's sites that have no thumbnail
  const articles = await prisma.article.findMany({
    where: {
      thumbnailUrl: null,
      site: { userId },
    },
    select: { id: true, url: true },
    orderBy: { publishedAt: "desc" },
    take: 50, // process up to 50 at a time
  });

  let updated = 0;
  await Promise.all(
    articles.map(async (article) => {
      const ogImage = await fetchOgImage(article.url);
      if (ogImage) {
        await prisma.article.update({
          where: { id: article.id },
          data: { thumbnailUrl: ogImage },
        });
        updated++;
      }
    })
  );

  return Response.json({ processed: articles.length, updated });
}

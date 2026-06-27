import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

// Common RSS feed path suffixes to probe when <link> tag is absent
const PROBE_PATHS = [
  "/feed",
  "/feed/",
  "/rss",
  "/rss.xml",
  "/feed.rss",
  "/index.xml",
  "/atom.xml",
  "/feed/atom",
  "/feeds/posts/default",
];

async function isXmlFeed(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(6000),
      redirect: "follow",
    });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("xml") || ct.includes("rss") || ct.includes("atom")) return true;
    const text = await res.text();
    return /<(rss|feed|rdf:RDF)/i.test(text.slice(0, 500));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await request.json();
  if (!url) {
    return Response.json({ error: "url is required" }, { status: 400 });
  }

  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Step 1: Fetch the page and look for <link rel="alternate"> RSS tags
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (res.ok) {
      const html = await res.text();
      // Extract all alternate RSS/Atom link tags
      const linkRegex =
        /<link[^>]+rel=["']alternate["'][^>]*type=["'](application\/(rss\+xml|atom\+xml)|text\/xml)["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
      const altRegex =
        /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']alternate["'][^>]*type=["'](application\/(rss\+xml|atom\+xml)|text\/xml)["'][^>]*>/gi;

      let feedUrl: string | null = null;
      let title: string | null = null;

      for (const regex of [linkRegex, altRegex]) {
        let m: RegExpExecArray | null;
        while ((m = regex.exec(html)) !== null) {
          // href is captured in group 3 for linkRegex, group 1 for altRegex
          const href = regex === linkRegex ? m[3] : m[1];
          if (href) {
            feedUrl = href.startsWith("http") ? href : new URL(href, url).toString();
            // Try to extract title attribute
            const titleMatch = m[0].match(/title=["']([^"']+)["']/i);
            title = titleMatch?.[1] ?? null;
            break;
          }
        }
        if (feedUrl) break;
      }

      if (feedUrl) {
        return Response.json({ feedUrl, title });
      }

      // Step 2: Look for plain href links that look like feeds in the HTML
      const feedLinkMatch = html.match(
        /href=["'](https?:\/\/[^"']*(?:feed|rss|atom)[^"']*\.(?:rss|xml|atom)?)["']/i
      );
      if (feedLinkMatch?.[1]) {
        return Response.json({ feedUrl: feedLinkMatch[1], title: null });
      }
    }
  } catch {
    // Fall through to probing
  }

  // Step 3: Probe common feed paths on the origin
  for (const path of PROBE_PATHS) {
    const candidate = origin + path;
    if (await isXmlFeed(candidate)) {
      return Response.json({ feedUrl: candidate, title: null });
    }
  }

  return Response.json({ error: "RSS/Atomフィードが見つかりませんでした" }, { status: 404 });
}

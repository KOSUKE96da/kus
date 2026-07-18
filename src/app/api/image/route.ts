import { NextRequest } from "next/server";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
};

// Block loopback / private / link-local hosts to limit SSRF exposure.
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "0.0.0.0" || h === "::1") return true;
  if (h.startsWith("127.") || h.startsWith("10.") || h.startsWith("192.168.")) return true;
  if (h.startsWith("169.254.")) return true; // link-local
  if (h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true; // IPv6 ULA/link-local
  const m = h.match(/^172\.(\d+)\./); // 172.16.0.0 – 172.31.255.255
  if (m) {
    const octet = Number(m[1]);
    if (octet >= 16 && octet <= 31) return true;
  }
  return false;
}

// GET /api/image?url=<encoded image url>
// Proxies remote feed images through our own origin so ad blockers, network
// filters, and hotlink/referer protection can't stop them from loading in the
// browser. (The TWA/app already renders them; this fixes the web version.)
export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");
  if (!target) return new Response(null, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return new Response(null, { status: 400 });
  }
  if (isBlockedHost(parsed.hostname)) {
    return new Response(null, { status: 400 });
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: FETCH_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.startsWith("image/")) {
      return new Response(null, { status: 404 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > 8 * 1024 * 1024) {
      return new Response(null, { status: 413 });
    }

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        // Cache hard at the CDN + browser; feed images don't change.
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;

  const sites = await prisma.site.findMany({
    where: { userId },
    select: { id: true, name: true, lastFetched: true },
  });

  const stats = await Promise.all(
    sites.map(async (site) => {
      const count = await prisma.article.count({ where: { siteId: site.id } });
      const latest = await prisma.article.findFirst({
        where: { siteId: site.id },
        orderBy: { publishedAt: "desc" },
        select: { title: true, publishedAt: true, url: true },
      });
      const oldest = await prisma.article.findFirst({
        where: { siteId: site.id },
        orderBy: { publishedAt: "asc" },
        select: { publishedAt: true },
      });
      return { site: site.name, lastFetched: site.lastFetched, count, latest, oldest };
    })
  );

  const totalArticles = await prisma.article.count({ where: { site: { userId } } });

  return Response.json({ totalArticles, stats });
}

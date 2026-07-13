import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/getSession";
import { prisma } from "@/lib/prisma";
import SitesContent from "./SitesContent";

export default async function SitesPage() {
  const session = await getCachedSession();
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;
  const raw = await prisma.site.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const sites = raw.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    lastFetched: s.lastFetched ? s.lastFetched.toISOString() : null,
  }));

  return <SitesContent initialSites={sites} />;
}

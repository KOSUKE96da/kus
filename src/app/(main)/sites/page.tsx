import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SitesContent from "./SitesContent";

export default async function SitesPage() {
  const session = await getServerSession(authOptions);
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

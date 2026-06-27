import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MainLayoutClient from "./MainLayoutClient";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id as string;

  // Get unread count
  const userSites = await prisma.site.findMany({
    where: { userId },
    select: { id: true },
  });
  const userSiteIds = userSites.map((s) => s.id);

  let unreadCount = 0;
  if (userSiteIds.length > 0) {
    const totalArticles = await prisma.article.count({
      where: { siteId: { in: userSiteIds } },
    });
    const readArticles = await prisma.readStatus.count({
      where: { userId, isRead: true, article: { siteId: { in: userSiteIds } } },
    });
    unreadCount = totalArticles - readArticles;
  }

  return (
    <MainLayoutClient
      user={{
        name: session.user.name || session.user.email || "User",
        email: session.user.email || "",
        image: session.user.image || null,
      }}
      unreadCount={unreadCount}
    >
      {children}
    </MainLayoutClient>
  );
}

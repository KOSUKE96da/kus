import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import MainLayoutClient from "./(main)/MainLayoutClient";
import HomeContent from "./(main)/HomeContent";
import { getArticles, getUnreadCount } from "@/lib/getArticles";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id as string;

  // Fetch unread count and initial articles in parallel
  const [unreadCount, initialArticles] = await Promise.all([
    getUnreadCount(userId),
    getArticles(userId, "all", "desc"),
  ]);

  return (
    <MainLayoutClient
      user={{
        name: session.user.name || session.user.email || "User",
        email: session.user.email || "",
        image: session.user.image || null,
      }}
      unreadCount={unreadCount}
    >
      <HomeContent initialArticles={initialArticles} />
    </MainLayoutClient>
  );
}

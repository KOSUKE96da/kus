import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/getSession";
import MainLayoutClient from "./(main)/MainLayoutClient";
import HomeContent from "./(main)/HomeContent";
import { getUnreadCount } from "@/lib/getArticles";

export default async function RootPage() {
  const session = await getCachedSession();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id as string;

  // 記事はクライアント側でフェッチするためここでは未読数のみ取得（高速化）
  const unreadCount = await getUnreadCount(userId);

  return (
    <MainLayoutClient
      user={{
        name: session.user.name || session.user.email || "User",
        email: session.user.email || "",
        image: session.user.image || null,
      }}
      unreadCount={unreadCount}
    >
      <HomeContent />
    </MainLayoutClient>
  );
}

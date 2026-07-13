import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/getSession";
import { getUnreadCount } from "@/lib/getArticles";
import MainLayoutClient from "./MainLayoutClient";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getCachedSession();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id as string;
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
      {children}
    </MainLayoutClient>
  );
}

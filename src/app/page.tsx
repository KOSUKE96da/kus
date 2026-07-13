import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/getSession";
import MainLayoutClient from "./(main)/MainLayoutClient";
import HomeContent from "./(main)/HomeContent";

export default async function RootPage() {
  const session = await getCachedSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <MainLayoutClient
      user={{
        name: session.user.name || session.user.email || "User",
        email: session.user.email || "",
        image: session.user.image || null,
      }}
      unreadCount={0}
    >
      <HomeContent />
    </MainLayoutClient>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import LoginTransitionOverlay from "@/components/LoginTransitionOverlay";

interface Props {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
  unreadCount: number;
}

const navLinks = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/sites", label: "サイト管理", icon: "📡" },
  { href: "/settings", label: "設定", icon: "⚙️" },
];

const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export default function MainLayoutClient({ children, user, unreadCount }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const avatarImage = session?.user?.image ?? user.image;
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const didAutoRefresh = useRef(false);

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshMsg(null);
    window.dispatchEvent(new CustomEvent("feedRefreshStart"));
    try {
      const res = await fetch("/api/feed/refresh", { method: "POST" });
      const data = await res.json();
      fetch("/api/feed/fetch-thumbnails", { method: "POST" }).catch(() => {});
      setRefreshMsg(`${data.newArticles} 件の新着記事を取得しました`);
      setTimeout(() => setRefreshMsg(null), 4000);
      window.dispatchEvent(new CustomEvent("feedRefreshed"));
    } catch {
      setRefreshMsg("更新に失敗しました");
      setTimeout(() => setRefreshMsg(null), 4000);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (didAutoRefresh.current) return;
    didAutoRefresh.current = true;
    const key = "feedhub_last_auto_refresh";
    const last = Number(localStorage.getItem(key) ?? 0);
    if (Date.now() - last < AUTO_REFRESH_INTERVAL_MS) return;
    localStorage.setItem(key, String(Date.now()));
    handleRefresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <LoginTransitionOverlay />
      <header className="bg-gray-900 border-b border-gray-800 shrink-0 z-20 sticky top-0">
        <div className="h-12 flex items-center px-3 gap-3">
          <button
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 shrink-0"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="メニューを開く"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/" className="text-xl font-bold text-yellow-400 shrink-0">
            KuroFeed
          </Link>

          {unreadCount > 0 && (
            <span className="hidden md:inline bg-yellow-900/40 text-yellow-400 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
              {unreadCount} 未読
            </span>
          )}

          <div className="flex-1" />

          {refreshMsg && (
            <span className="text-sm text-green-400 hidden md:block shrink-0">
              {refreshMsg}
            </span>
          )}

          {pathname === "/" && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="hidden md:flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-medium rounded-lg transition shrink-0 min-w-[7rem]"
            >
              <svg
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? "更新中..." : "記事を更新"}
            </button>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {avatarImage ? (
              <img src={avatarImage} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-yellow-400 text-gray-900 text-xs font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
            )}
            <span className="hidden sm:block text-sm text-gray-300 max-w-[100px] truncate">
              {user.name}
            </span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-400 hover:text-red-400 transition shrink-0"
          >
            ログアウト
          </button>
        </div>

        {(pathname === "/" || unreadCount > 0) && (
          <div className="md:hidden flex items-center px-3 pb-2 gap-2">
            {unreadCount > 0 && (
              <span className="bg-yellow-900/40 text-yellow-400 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
                {unreadCount} 未読
              </span>
            )}
            <div className="flex-1" />
            {refreshMsg && (
              <span className="text-xs text-green-400 shrink-0">{refreshMsg}</span>
            )}
            {pathname === "/" && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-medium rounded-lg transition shrink-0 min-w-[7rem]"
              >
                <svg
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? "更新中..." : "記事を更新"}
              </button>
            )}
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-10 bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            fixed md:sticky md:top-0 inset-y-0 left-0 z-30 w-56 bg-gray-900 border-r border-gray-800
            flex flex-col pt-14 md:pt-0 md:h-full transition-transform duration-200 shrink-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition
                    ${isActive
                      ? "bg-yellow-950/30 text-yellow-400 font-semibold"
                      : "text-gray-300 hover:bg-gray-800"
                    }
                  `}
                >
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                  {link.href === "/" && unreadCount > 0 && (
                    <span className="ml-auto bg-yellow-400 text-gray-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

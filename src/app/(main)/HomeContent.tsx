"use client";

import { useState, useEffect, useCallback } from "react";
import ArticleCard, { ArticleData } from "@/components/ArticleCard";

type Filter = "all" | "unread" | "read" | "favorites";
type Sort = "desc" | "asc";

export default function HomeContent() {
  const [allArticles, setAllArticles] = useState<ArticleData[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("desc");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter, sort });
      const res = await fetch(`/api/articles?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAllArticles(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      window.dispatchEvent(new CustomEvent("kf_home_ready"));
    }
  }, [filter, sort]);

  useEffect(() => {
    fetchArticles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!mounted) { setMounted(true); return; }
    fetchArticles();
  }, [filter, sort]);

  useEffect(() => {
    const onStart = () => setLoading(true);
    const onDone = () => fetchArticles();
    window.addEventListener("feedRefreshStart", onStart);
    window.addEventListener("feedRefreshed", onDone);
    return () => {
      window.removeEventListener("feedRefreshStart", onStart);
      window.removeEventListener("feedRefreshed", onDone);
    };
  }, [fetchArticles]);

  function handleReadChange(id: string, isRead: boolean) {
    setAllArticles((prev) => prev.map((a) => (a.id === id ? { ...a, isRead } : a)));
  }

  function handleFavoriteChange(id: string, isFavorite: boolean) {
    setAllArticles((prev) => prev.map((a) => (a.id === id ? { ...a, isFavorite } : a)));
  }

  const unreadCount = allArticles.filter((a) => !a.isRead).length;

  const q = search.trim().toLowerCase();
  const displayedArticles = q
    ? allArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.siteName ?? "").toLowerCase().includes(q)
      )
    : allArticles;

  const filterButtons: { key: Filter; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "unread", label: "未読" },
    { key: "read", label: "既読" },
    { key: "favorites", label: "お気に入り" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-950 px-4 md:px-6 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 shrink-0">
            ホーム
            {unreadCount > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({unreadCount} 未読)
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-1 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`flex-1 px-3 py-1.5 text-sm transition whitespace-nowrap ${
                  filter === btn.key
                    ? "bg-yellow-400 text-gray-900 font-medium"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

            <button
            onClick={() => setSort((s) => (s === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition shrink-0"
          >
            {sort === "desc" ? "▼ 新しい順" : "▲ 古い順"}
          </button>
        </div>

        {/* 検索バー */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="記事を検索..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="px-4 md:px-6 py-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <svg className="w-8 h-8 text-yellow-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="text-sm text-yellow-400">記事を読み込んでいます...</p>
          </div>
        )}
        {!loading && displayedArticles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600">
            <div className="text-5xl mb-4">📰</div>
            <p className="text-lg font-medium mb-2">記事がありません</p>
            <p className="text-sm">
              {q
                ? "検索キーワードを変えてみてください"
                : filter !== "all"
                ? "フィルターを変更してみてください"
                : "サイトを追加して「記事を更新」ボタンを押してください"}
            </p>
          </div>
        )}
        {!loading && displayedArticles.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {displayedArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onReadChange={handleReadChange}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

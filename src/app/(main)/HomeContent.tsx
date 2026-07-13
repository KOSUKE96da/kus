"use client";

import { useState, useEffect, useCallback } from "react";
import ArticleCard, { ArticleData } from "@/components/ArticleCard";

type Filter = "all" | "unread" | "read" | "favorites";
type Sort = "desc" | "asc";

interface Props {
  initialArticles?: ArticleData[];
}

export default function HomeContent({ initialArticles }: Props) {
  const [allArticles, setAllArticles] = useState<ArticleData[]>(initialArticles ?? []);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("desc");
  const [loading, setLoading] = useState(false);

  // router.refresh() でサーバーから新しい initialArticles が来たら反映する
  useEffect(() => {
    if (initialArticles) setAllArticles(initialArticles);
  }, [initialArticles]);

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
    }
  }, [filter, sort]);

  // Only fetch from API when filter/sort changes (not on initial mount)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!mounted) { setMounted(true); return; }
    fetchArticles();
  }, [filter, sort]);

  // feedRefreshed イベントで記事を再取得
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

  // Apply filter/sort client-side on initial data; server handles it on re-fetch
  const articles = mounted
    ? allArticles
    : allArticles
        .filter((a) => {
          if (filter === "read") return a.isRead;
          if (filter === "unread") return !a.isRead;
          if (filter === "favorites") return a.isFavorite;
          return true;
        })
        .sort((a, b) =>
          sort === "asc"
            ? new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
            : new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );

  const unreadCount = allArticles.filter((a) => !a.isRead).length;

  const filterButtons: { key: Filter; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "unread", label: "未読" },
    { key: "read", label: "既読" },
    { key: "favorites", label: "お気に入り" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-950 px-4 md:px-6 py-3 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          ホーム
          {unreadCount > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              ({unreadCount} 未読)
            </span>
          )}
        </h1>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`px-3 py-1.5 text-sm transition ${
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            {sort === "desc" ? "▼ 新しい順" : "▲ 古い順"}
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 py-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-3 mb-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl text-yellow-700 dark:text-yellow-400 text-sm font-medium">
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            記事を読み込んでいます...
          </div>
        )}
        {!loading && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600">
            <div className="text-5xl mb-4">📰</div>
            <p className="text-lg font-medium mb-2">記事がありません</p>
            <p className="text-sm">
              {filter !== "all"
                ? "フィルターを変更してみてください"
                : "サイトを追加して「更新」ボタンを押してください"}
            </p>
          </div>
        )}
        {articles.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {articles.map((article) => (
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

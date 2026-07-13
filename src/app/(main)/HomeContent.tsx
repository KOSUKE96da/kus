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
      // ログイン遷移スピナーを消す
      window.dispatchEvent(new CustomEvent("kf_home_ready"));
    }
  }, [filter, sort]);

  // マウント直後に記事を取得
  useEffect(() => {
    fetchArticles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // フィルター・ソート変更時に再取得
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
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-56 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        )}
        {!loading && allArticles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600">
            <div className="text-5xl mb-4">📰</div>
            <p className="text-lg font-medium mb-2">記事がありません</p>
            <p className="text-sm">
              {filter !== "all"
                ? "フィルターを変更してみてください"
                : "サイトを追加して「記事を更新」ボタンを押してください"}
            </p>
          </div>
        )}
        {!loading && allArticles.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {allArticles.map((article) => (
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

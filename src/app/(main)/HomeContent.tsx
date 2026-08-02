"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ArticleCard, { ArticleData } from "@/components/ArticleCard";

type Filter = "all" | "unread" | "read" | "favorites";
type Sort = "desc" | "asc";

export default function HomeContent() {
  const [allArticles, setAllArticles] = useState<ArticleData[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("desc");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // Render the list progressively — the full set can be hundreds of cards, so
  // only mount a slice and grow it as the user scrolls (data is still fetched
  // in full so search/filter/counts stay accurate).
  const PAGE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchArticles = useCallback(async (silent = false) => {
    // silent = background refresh: keep the current list on screen and merge
    // the result in place, so the home view never blanks out to a spinner.
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/articles?${new URLSearchParams({ filter, sort })}`);
      if (res.ok) setAllArticles(await res.json());
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false);
      window.dispatchEvent(new CustomEvent("kf_home_ready"));
    }
  }, [filter, sort]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    const onRefreshed = () => fetchArticles(true);
    window.addEventListener("feedRefreshed", onRefreshed);
    return () => {
      window.removeEventListener("feedRefreshed", onRefreshed);
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

  const visibleArticles = displayedArticles.slice(0, visibleCount);
  const hasMore = visibleCount < displayedArticles.length;

  // Reset the window when the visible set changes (filter/sort/search).
  useEffect(() => {
    setVisibleCount(PAGE);
  }, [filter, sort, search]);

  // Grow the window as the sentinel nears the viewport.
  useEffect(() => {
    if (!hasMore) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((c) => c + PAGE);
      },
      { rootMargin: "800px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, displayedArticles.length]);

  const filterButtons: { key: Filter; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "unread", label: "未読" },
    { key: "read", label: "既読" },
    { key: "favorites", label: "お気に入り" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="sticky top-0 z-20 bg-gray-950 px-4 md:px-6 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-100 shrink-0">
            ホーム
            {unreadCount > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({unreadCount} 未読)
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-1 rounded-lg overflow-hidden border border-gray-700">
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`flex-1 px-1 md:px-3 py-1.5 text-xs md:text-sm transition whitespace-nowrap ${
                  filter === btn.key
                    ? "bg-yellow-400 text-gray-900 font-medium"
                    : "bg-gray-900 text-gray-400 hover:bg-gray-800"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSort((s) => (s === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-gray-400 hover:bg-gray-800 transition shrink-0"
          >
            {sort === "desc" ? "▼ 新しい順" : "▲ 古い順"}
          </button>
        </div>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="記事を検索..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
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
          <div className="flex flex-col items-center justify-center py-24 text-gray-600">
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
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {visibleArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onReadChange={handleReadChange}
                  onFavoriteChange={handleFavoriteChange}
                />
              ))}
            </div>
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                <svg className="w-6 h-6 text-yellow-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

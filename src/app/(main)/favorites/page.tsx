"use client";

import { useState, useEffect, useCallback } from "react";
import ArticleCard, { ArticleData } from "@/components/ArticleCard";

export default function FavoritesPage() {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingAll, setRemovingAll] = useState(false);
  const [search, setSearch] = useState("");

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles?filter=favorites&sort=desc");
      if (res.ok) setArticles(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  function handleReadChange(id: string, isRead: boolean) {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, isRead } : a)));
  }

  function handleFavoriteChange(id: string, isFavorite: boolean) {
    setArticles((prev) =>
      isFavorite
        ? prev.map((a) => (a.id === id ? { ...a, isFavorite } : a))
        : prev.filter((a) => a.id !== id)
    );
  }

  async function handleRemoveAll() {
    setRemovingAll(true);
    try {
      await Promise.all(
        articles.map((a) =>
          fetch(`/api/articles/${a.id}/favorite`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isFavorite: false }),
          })
        )
      );
      setArticles([]);
    } catch {
      // ignore
    } finally {
      setRemovingAll(false);
    }
  }

  const q = search.trim().toLowerCase();
  const displayed = q
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.siteName ?? "").toLowerCase().includes(q)
      )
    : articles;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="sticky top-0 z-20 bg-gray-950 px-4 md:px-6 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-100">
            お気に入り
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({articles.length} 件)
            </span>
          </h1>
          {articles.length > 0 && (
            <button
              onClick={handleRemoveAll}
              disabled={removingAll}
              className="ml-auto px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-red-400 hover:bg-red-950 disabled:opacity-60 transition"
            >
              {removingAll ? "処理中..." : "すべて解除"}
            </button>
          )}
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <svg className="w-8 h-8 text-yellow-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="text-sm text-yellow-400">記事を読み込んでいます...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-600">
            <div className="text-5xl mb-4">★</div>
            <p className="text-lg font-medium mb-2">
              {q ? "一致する記事がありません" : "お気に入りはありません"}
            </p>
            <p className="text-sm">
              {q ? "検索キーワードを変えてみてください" : "記事の ★ ボタンでお気に入りに追加できます"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {displayed.map((article) => (
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

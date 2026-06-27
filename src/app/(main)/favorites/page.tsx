"use client";

import { useState, useEffect, useCallback } from "react";
import ArticleCard, { ArticleData } from "@/components/ArticleCard";

export default function FavoritesPage() {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingAll, setRemovingAll] = useState(false);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles?filter=all&sort=desc");
      if (res.ok) {
        const data: ArticleData[] = await res.json();
        setArticles(data.filter((a) => a.isFavorite));
      }
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
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead } : a))
    );
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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          お気に入り
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            ({articles.length} 件)
          </span>
        </h1>

        {articles.length > 0 && (
          <button
            onClick={handleRemoveAll}
            disabled={removingAll}
            className="ml-auto px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-60 transition"
          >
            {removingAll ? "処理中..." : "すべて解除"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-56 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600">
          <div className="text-5xl mb-4">★</div>
          <p className="text-lg font-medium mb-2">お気に入りはありません</p>
          <p className="text-sm">記事の ★ ボタンでお気に入りに追加できます</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
  );
}

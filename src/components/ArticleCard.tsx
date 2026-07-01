"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

export interface ArticleData {
  id: string;
  siteId: string;
  siteName: string;
  faviconUrl: string | null;
  title: string;
  url: string;
  publishedAt: string;
  thumbnailUrl: string | null;
  excerpt: string | null;
  isRead: boolean;
  isFavorite: boolean;
}

interface Props {
  article: ArticleData;
  onReadChange?: (id: string, isRead: boolean) => void;
  onFavoriteChange?: (id: string, isFavorite: boolean) => void;
}

export default function ArticleCard({ article, onReadChange, onFavoriteChange }: Props) {
  const [isRead, setIsRead] = useState(article.isRead);
  const [isFavorite, setIsFavorite] = useState(article.isFavorite);
  const [readLoading, setReadLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const publishedDate = new Date(article.publishedAt);
  const relativeTime = formatDistanceToNow(publishedDate, {
    addSuffix: true,
    locale: ja,
  });

  async function handleMarkRead(newIsRead: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    if (readLoading) return;
    // Optimistic
    setIsRead(newIsRead);
    onReadChange?.(article.id, newIsRead);
    setReadLoading(true);
    try {
      await fetch(`/api/articles/${article.id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: newIsRead }),
      });
    } catch {
      // Revert on error
      setIsRead(!newIsRead);
      onReadChange?.(article.id, !newIsRead);
    } finally {
      setReadLoading(false);
    }
  }

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    if (favLoading) return;
    const newFav = !isFavorite;
    // Optimistic
    setIsFavorite(newFav);
    onFavoriteChange?.(article.id, newFav);
    setFavLoading(true);
    try {
      await fetch(`/api/articles/${article.id}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: newFav }),
      });
    } catch {
      setIsFavorite(!newFav);
      onFavoriteChange?.(article.id, !newFav);
    } finally {
      setFavLoading(false);
    }
  }

  async function handleCardClick() {
    window.open(article.url, "_blank", "noopener,noreferrer");
    if (!isRead) {
      setIsRead(true);
      onReadChange?.(article.id, true);
      try {
        await fetch(`/api/articles/${article.id}/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        });
      } catch {
        // ignore
      }
    }
  }

  return (
    <div
      className={`
        group relative flex flex-col rounded-xl overflow-hidden cursor-pointer
        transition-all duration-200
        ${isFavorite
          ? "bg-white dark:bg-gray-900 border-l-[5px] border-r-[5px] border-l-red-500 border-r-red-500 border-t border-b border-t-gray-200 border-b-gray-200 dark:border-t-gray-700 dark:border-b-gray-700 hover:shadow-lg"
          : isRead
            ? "bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 hover:shadow-sm opacity-70 hover:opacity-90"
            : "bg-white dark:bg-gray-900 border-l-[3px] border-r-[3px] border-l-yellow-400 border-r-yellow-400 border-t border-b border-t-gray-200 border-b-gray-200 dark:border-t-gray-700 dark:border-b-gray-700 hover:shadow-lg"
        }
      `}
      onClick={handleCardClick}
    >
      {/* Unread indicator dot */}
      {!isRead && (
        <span className="absolute top-2.5 right-2.5 z-10 w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm" />
      )}

      {/* Thumbnail */}
      {article.thumbnailUrl && (
        <div className="relative h-40 overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={article.thumbnailUrl}
            alt=""
            className={`w-full h-full object-cover transition-all duration-300
              ${isRead && !isFavorite ? "grayscale-[40%] brightness-90" : "group-hover:scale-105"}
            `}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {/* Unread badge on image */}
          {!isRead && (
            <span className="absolute top-2 left-2 bg-yellow-400 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shadow">
              NEW
            </span>
          )}
        </div>
      )}

      {/* No thumbnail unread badge */}
      {!isRead && !article.thumbnailUrl && (
        <div className="px-4 pt-3">
          <span className="inline-block bg-yellow-400 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
            NEW
          </span>
        </div>
      )}

      <div className="flex flex-col flex-1 p-4">
        {/* Site info */}
        <div className="flex items-center gap-1.5 mb-2">
          {article.faviconUrl ? (
            <img
              src={article.faviconUrl}
              alt=""
              className={`w-4 h-4 rounded ${isRead ? "opacity-60" : ""}`}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className={`w-4 h-4 rounded ${isRead ? "bg-gray-300 dark:bg-gray-600" : "bg-blue-100 dark:bg-blue-900"}`} />
          )}
          <span className={`text-xs truncate ${isRead ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"}`}>
            {article.siteName}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto shrink-0">
            {relativeTime}
          </span>
        </div>

        {/* Title */}
        <h3
          className={`
            text-sm leading-snug mb-2 line-clamp-2
            ${isRead && !isFavorite
              ? "font-normal text-gray-400 dark:text-gray-500"
              : "font-bold text-gray-900 dark:text-gray-50"
            }
          `}
        >
          {article.title}
        </h3>

        {/* Excerpt */}
        {article.excerpt && (
          <p className={`text-xs line-clamp-2 flex-1 ${isRead && !isFavorite ? "text-gray-400 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"}`}>
            {article.excerpt}
          </p>
        )}

        {/* Actions */}
        <div
          className={`flex items-center gap-2 mt-3 pt-3 border-t ${isRead ? "border-gray-200 dark:border-gray-700" : "border-gray-100 dark:border-gray-800"}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Favorite button */}
          <button
            onClick={handleToggleFavorite}
            disabled={favLoading}
            className={`
              text-lg leading-none transition
              ${isFavorite
                ? "text-red-500 hover:text-red-600"
                : "text-gray-300 dark:text-gray-600 hover:text-red-400"
              }
            `}
            aria-label={isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
            title={isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
          >
            ★
          </button>

          {/* Read status label */}
          {isRead && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 rounded">
              既読
            </span>
          )}

          {/* Read toggle button */}
          <button
            onClick={(e) => handleMarkRead(!isRead, e)}
            disabled={readLoading}
            className={`text-xs transition ml-auto ${
              isRead
                ? "text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                : "text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 font-medium"
            }`}
          >
            {isRead ? "未読に戻す" : "既読にする"}
          </button>
        </div>
      </div>
    </div>
  );
}

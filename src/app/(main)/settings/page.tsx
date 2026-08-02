"use client";

import { useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarCacheBust, setAvatarCacheBust] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user;
  const initials = (user?.name || user?.email || "U")[0].toUpperCase();
  const avatarUrl = user?.image ? `${user.image}?v=${avatarCacheBust}` : null;

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setUploading(true);
    try {
      const image = await resizeImage(file, 256);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (!res.ok) throw new Error("upload failed");
      setAvatarCacheBust(Date.now());
      await update({ avatarUpdated: true });
    } catch {
      setAvatarError("アップロードに失敗しました");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleAvatarRemove() {
    setUploading(true);
    try {
      await fetch("/api/user/avatar", { method: "DELETE" });
      await update({ avatarUpdated: true });
    } catch {
      setAvatarError("削除に失敗しました");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (res.ok) await signOut({ callbackUrl: "/login" });
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-100 mb-8">設定</h1>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          アカウント
        </h2>
        <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
          <div className="flex items-center gap-4 p-4">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.name || ""}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-yellow-400 text-gray-900 text-2xl font-bold flex items-center justify-center">
                  {initials}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-100 truncate">
                {user?.name || "名前未設定"}
              </p>
              <p className="text-sm text-gray-400 truncate">{user?.email}</p>
              {avatarError && (
                <p className="text-xs text-red-400 mt-1">{avatarError}</p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-xs px-3 py-1 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-gray-900 font-medium rounded-lg transition"
                >
                  画像を変更
                </button>
                {avatarUrl && (
                  <button
                    onClick={handleAvatarRemove}
                    disabled={uploading}
                    className="text-xs px-3 py-1 border border-gray-700 text-gray-400 hover:bg-gray-800 disabled:opacity-50 rounded-lg transition"
                  >
                    削除
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          <div className="p-4">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              ログアウト
            </button>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          アカウント削除
        </h2>
        <div className="bg-gray-900 rounded-xl border border-red-900 p-4">
          <p className="text-sm text-gray-400 mb-4">
            アカウントを削除すると、すべてのデータ（登録サイト・記事・既読状態・お気に入り）が完全に削除されます。この操作は取り消せません。
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm text-red-400 border border-red-700 rounded-lg hover:bg-red-950 transition"
            >
              アカウントを削除する
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-400">
                本当に削除しますか？この操作は取り消せません。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium rounded-lg transition"
                >
                  {deleting ? "削除中..." : "はい、削除します"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm border border-gray-700 rounded-lg text-gray-400 hover:bg-gray-800 transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          アプリ情報
        </h2>
        <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-gray-300">アプリ名</span>
            <span className="text-sm font-medium text-gray-100">KuroFeed</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-gray-300">バージョン</span>
            <span className="text-sm font-medium text-gray-100">50.00.50</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-gray-300">フレームワーク</span>
            <span className="text-sm font-medium text-gray-100">Next.js 16</span>
          </div>
        </div>
      </section>
    </div>
  );
}

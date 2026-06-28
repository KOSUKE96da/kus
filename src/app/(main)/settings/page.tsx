"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

type Theme = "light" | "dark" | "system";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("theme") as Theme) || "system";
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  if (theme === "dark") {
    html.classList.add("dark");
  } else if (theme === "light") {
    html.classList.remove("dark");
  } else {
    // System
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  }

  const themeOptions: { key: Theme; label: string; icon: string }[] = [
    { key: "light", label: "ライト", icon: "☀️" },
    { key: "dark", label: "ダーク", icon: "🌙" },
    { key: "system", label: "システム", icon: "💻" },
  ];

  const user = session?.user;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        設定
      </h1>

      {/* Account section */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          アカウント
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          <div className="flex items-center gap-4 p-4">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || ""}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white text-lg font-bold flex items-center justify-center">
                {(user?.name || user?.email || "U")[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {user?.name || "名前未設定"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="p-4">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              ログアウト
            </button>
          </div>
        </div>
      </section>

      {/* Theme section */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          テーマ
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleThemeChange(opt.key)}
                className={`flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition ${
                  theme === opt.key
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            テーマの設定はブラウザのローカルストレージに保存されます
          </p>
        </div>
      </section>

      {/* App info */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          アプリ情報
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">アプリ名</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">KuroFeed</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">バージョン</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">1.0.0</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">フレームワーク</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Next.js 16</span>
          </div>
        </div>
      </section>
    </div>
  );
}

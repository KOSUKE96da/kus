"use client";

import { useState, useEffect, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    router.prefetch("/");
    fetch("/api/auth/session").catch(() => {});
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("メールアドレスまたはパスワードが正しくありません");
        setLoading(false);
      } else {
        sessionStorage.setItem("kf_login_pending", "1");
        window.location.href = "/";
      }
    } catch {
      setError("ログイン中にエラーが発生しました");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        backgroundColor: "#030712",
      }}>
        <style>{`@keyframes kf-spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{
          width: "48px",
          height: "48px",
          border: "4px solid #facc15",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "kf-spin 0.8s linear infinite",
        }} />
        <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>ログイン中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">KuroFeed</h1>
          <p className="mt-2 text-gray-400 text-sm">
            RSSフィードを一箇所で管理
          </p>
        </div>

        <div className="bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-800">
          <h2 className="text-xl font-semibold text-gray-100 mb-6">
            ログイン
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-950 border border-red-800 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-700 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-700 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
            >
              ログイン
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            アカウントをお持ちでない方は{" "}
            <Link
              href="/register"
              className="text-yellow-400 hover:underline font-medium"
            >
              新規登録
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-gray-600">
          <Link href="/" className="hover:underline">
            トップページへ
          </Link>
        </p>
      </div>
    </div>
  );
}

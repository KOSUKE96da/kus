"use client";

import { useLayoutEffect, useState } from "react";

export default function LoginTransitionOverlay() {
  const [show, setShow] = useState(false);

  useLayoutEffect(() => {
    if (!sessionStorage.getItem("kf_login_pending")) return;
    setShow(true);

    const hide = () => {
      setShow(false);
      sessionStorage.removeItem("kf_login_pending");
    };

    window.addEventListener("kf_home_ready", hide, { once: true });
    return () => window.removeEventListener("kf_home_ready", hide);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 gap-4">
      <svg
        className="w-12 h-12 text-yellow-400 animate-spin"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      <p className="text-gray-500 dark:text-gray-400 text-sm">ログイン中...</p>
    </div>
  );
}

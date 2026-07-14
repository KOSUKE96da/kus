"use client";

import { useLayoutEffect, useState } from "react";

export default function LoginTransitionOverlay() {
  const [show, setShow] = useState(false);

  useLayoutEffect(() => {
    if (!sessionStorage.getItem("kf_login_pending")) return;
    setShow(true);
    document.documentElement.style.visibility = "";

    // If an auto feed-refresh kicks in on load, keep the overlay up until the
    // POST-refresh article list is ready — otherwise the pre-refresh list
    // flashes for a moment before being replaced. When no refresh runs, the
    // first "home ready" is already the final list, so dismiss then.
    let refreshPending = false;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      cleanup();
      setShow(false);
      sessionStorage.removeItem("kf_login_pending");
    };

    const onRefreshStart = () => {
      refreshPending = true;
    };
    const onRefreshed = () => {
      // Refresh finished; the follow-up fetch will fire kf_home_ready next.
      refreshPending = false;
    };
    const onReady = () => {
      if (!refreshPending) finish();
    };

    // Safety net: never keep the overlay up indefinitely (e.g. refresh hang).
    const safety = window.setTimeout(finish, 15000);

    function cleanup() {
      window.clearTimeout(safety);
      window.removeEventListener("feedRefreshStart", onRefreshStart);
      window.removeEventListener("feedRefreshed", onRefreshed);
      window.removeEventListener("kf_home_ready", onReady);
    }

    window.addEventListener("feedRefreshStart", onRefreshStart);
    window.addEventListener("feedRefreshed", onRefreshed);
    window.addEventListener("kf_home_ready", onReady);
    return cleanup;
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 gap-4">
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
      <p className="text-gray-400 text-sm">ログイン中...</p>
    </div>
  );
}

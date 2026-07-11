"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";

interface Site {
  id: string;
  name: string;
  feedUrl: string;
  siteUrl: string | null;
  category: string | null;
  tags: string | null;
  isActive: boolean;
  lastFetched: string | null;
  createdAt: string;
}

interface Props {
  initialSites: Site[];
}

export default function SitesContent({ initialSites }: Props) {
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSiteUrl, setFormSiteUrl] = useState("");
  const [formFeedUrl, setFormFeedUrl] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState<string | null>(null);

  function openAddForm() {
    setEditingId(null);
    setFormName("");
    setFormSiteUrl("");
    setFormFeedUrl("");
    setFormCategory("");
    setError(null);
    setDetectMsg(null);
    setShowForm(true);
  }

  function openEditForm(site: Site) {
    setEditingId(site.id);
    setFormName(site.name);
    setFormSiteUrl(site.siteUrl || "");
    setFormFeedUrl(site.feedUrl);
    setFormCategory(site.category || "");
    setError(null);
    setDetectMsg(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setError(null);
    setDetectMsg(null);
  }

  async function handleDetectFeed() {
    const urlToDetect = formSiteUrl || formFeedUrl;
    if (!urlToDetect) return;
    setDetecting(true);
    setDetectMsg(null);
    try {
      const res = await fetch("/api/feed/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToDetect }),
      });
      const data = await res.json();
      if (res.ok && data.feedUrl) {
        setFormFeedUrl(data.feedUrl);
        if (!formName && data.title) setFormName(data.title);
        setDetectMsg("RSS???????????");
      } else {
        setDetectMsg(data.error || "???????????????");
      }
    } catch {
      setDetectMsg("?????????");
    } finally {
      setDetecting(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingId) {
        const res = await fetch(`/api/sites/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            feedUrl: formFeedUrl,
            category: formCategory || null,
          }),
        });
        if (!res.ok) throw new Error("?????????");
        const updated: Site = await res.json();
        setSites((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
      } else {
        const res = await fetch("/api/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            feedUrl: formFeedUrl,
            category: formCategory || null,
          }),
        });
        if (!res.ok) throw new Error("?????????");
        const created: Site = await res.json();
        setSites((prev) => [created, ...prev]);
      }
      closeForm();
    } catch (err: any) {
      setError(err.message || "??????????");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("??????????????????????????????")) return;
    try {
      await fetch(`/api/sites/${id}`, { method: "DELETE" });
      setSites((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // ignore
    }
  }

  async function handleToggleActive(site: Site) {
    try {
      const res = await fetch(`/api/sites/${site.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !site.isActive }),
      });
      if (res.ok) {
        const updated: Site = await res.json();
        setSites((prev) => prev.map((s) => (s.id === site.id ? updated : s)));
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          ?????
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            ({sites.length} ?)
          </span>
        </h1>
        <button
          onClick={openAddForm}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg transition"
        >
          <span>+</span> ??????
        </button>
      </div>

      {/* Add/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {editingId ? "??????" : "??????"}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ???URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formSiteUrl}
                    onChange={(e) => setFormSiteUrl(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                    placeholder="https://example.com/news"
                  />
                  <button
                    type="button"
                    onClick={handleDetectFeed}
                    disabled={detecting || (!formSiteUrl && !formFeedUrl)}
                    className="shrink-0 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-700 transition"
                  >
                    {detecting ? "???..." : "RSS??"}
                  </button>
                </div>
                {detectMsg && (
                  <p className={`text-xs mt-1 ${detectMsg.includes("??????") ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                    {detectMsg}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ???? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                  placeholder="?: TechCrunch Japan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ????URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formFeedUrl}
                  onChange={(e) => setFormFeedUrl(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                  placeholder="https://example.com/feed.rss"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ????
                </label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                  placeholder="?: ??????"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-medium rounded-lg transition"
                >
                  {submitting ? "???..." : editingId ? "??" : "??"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-lg transition"
                >
                  ?????
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Site list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600">
          <div className="text-5xl mb-4">??</div>
          <p className="text-lg font-medium mb-2">?????????????</p>
          <p className="text-sm">?????????????RSS?????????????</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sites.map((site) => (
            <div
              key={site.id}
              className={`flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border ${
                site.isActive
                  ? "border-gray-200 dark:border-gray-800"
                  : "border-gray-100 dark:border-gray-900 opacity-60"
              }`}
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${site.isActive ? "bg-green-500" : "bg-gray-400"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">{site.name}</span>
                  {site.category && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full shrink-0">{site.category}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{site.feedUrl}</p>
                {site.lastFetched && (
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">????: {new Date(site.lastFetched).toLocaleString("ja-JP")}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleActive(site)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                    site.isActive
                      ? "border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {site.isActive ? "??" : "??"}
                </button>
                <button
                  onClick={() => openEditForm(site)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  ??
                </button>
                <button
                  onClick={() => handleDelete(site.id)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition"
                >
                  ??
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

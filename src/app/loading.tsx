export default function Loading() {
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header skeleton */}
      <div className="h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0" />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shrink-0 flex-col p-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>

        {/* Article grid skeleton */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse h-56" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

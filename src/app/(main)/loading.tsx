export default function Loading() {
  return (
    <div className="p-4 md:p-6">
      <div className="h-8 w-32 rounded-lg bg-gray-800 animate-pulse mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-gray-800 animate-pulse h-56" />
        ))}
      </div>
    </div>
  );
}

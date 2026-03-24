// ─────────────────────────────────────────────
//  components/LoadingSkeleton.js
//  Shown while data is being fetched.
//  Mimics the layout of the real dashboard
//  with shimmer placeholders.
// ─────────────────────────────────────────────

export default function LoadingSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-pulse2">

      {/* Profile skeleton */}
      <div className="glass-card p-6 flex items-center gap-5">
        <div className="skeleton w-20 h-20 rounded-full" />
        <div className="flex flex-col gap-3 flex-1">
          <div className="skeleton h-5 w-40" />
          <div className="skeleton h-3 w-64" />
          <div className="skeleton h-3 w-32" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card p-5 flex flex-col gap-3">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <div className="skeleton h-3 w-40 mb-5" />
          <div className="skeleton h-52 w-full" />
        </div>
        <div className="glass-card p-6">
          <div className="skeleton h-3 w-40 mb-5" />
          <div className="skeleton h-52 w-full" />
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="skeleton h-3 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton h-28 w-full" />
          <div className="skeleton h-28 w-full" />
        </div>
      </div>

      {/* Insight skeleton */}
      <div className="glass-card p-6">
        <div className="skeleton h-3 w-32 mb-4" />
        <div className="skeleton h-4 w-full mb-2" />
        <div className="skeleton h-4 w-5/6" />
      </div>
    </div>
  );
}
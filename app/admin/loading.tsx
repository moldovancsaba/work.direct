export default function Loading() {
  // WHAT: Loading UI for admin segment while routes or data are being fetched/lazy-loaded.
  // WHY: Prevents a blank screen during client transitions or SSR/CSR boundary hydration.
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading admin…</p>
      </div>
    </div>
  )
}

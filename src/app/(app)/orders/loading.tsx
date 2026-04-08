export default function Loading() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-24 bg-slate-200 rounded" />
        <div className="h-9 w-24 bg-slate-200 rounded-lg" />
      </div>
      <div className="flex items-center gap-2 mb-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-slate-200 rounded-lg" />
        ))}
        <div className="ml-auto h-8 w-20 bg-slate-200 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex gap-8">
          {['報價單號', '客戶', '狀態', '合約期間', '含稅總計', '主合約'].map((col) => (
            <div key={col} className="h-4 w-16 bg-slate-200 rounded" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-8 px-5 py-3.5 border-b border-slate-100">
            <div className="h-4 w-20 bg-slate-100 rounded" />
            <div className="h-4 w-28 bg-slate-100 rounded" />
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
            <div className="h-4 w-36 bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
            <div className="h-4 w-6 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

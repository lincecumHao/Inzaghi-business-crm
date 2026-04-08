export default function Loading() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-24 bg-slate-200 rounded" />
        <div className="h-9 w-24 bg-slate-200 rounded-lg" />
      </div>
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-56 bg-slate-200 rounded-lg" />
        <div className="h-9 w-20 bg-slate-200 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex gap-8">
          {['公司名稱', '統一編號', '聯絡人', '子公司', '到期提醒'].map((col) => (
            <div key={col} className="h-4 w-16 bg-slate-200 rounded" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-8 px-5 py-3.5 border-b border-slate-100">
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
            <div className="h-4 w-8 bg-slate-100 rounded" />
            <div className="h-4 w-8 bg-slate-100 rounded" />
            <div className="h-4 w-24 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

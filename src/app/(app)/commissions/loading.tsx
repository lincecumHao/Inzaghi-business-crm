export default function Loading() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-24 bg-slate-200 rounded" />
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-slate-200 rounded-lg" />
          <div className="h-9 w-32 bg-slate-200 rounded-lg" />
        </div>
      </div>
      <div className="mb-5 bg-blue-50 border border-blue-100 rounded-xl px-6 py-4 flex items-center justify-between">
        <div className="h-4 w-48 bg-blue-100 rounded" />
        <div className="h-5 w-32 bg-blue-100 rounded" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex gap-6">
          {['分潤日期', '客戶', '報價單號', '項目名稱', '項目金額', '費率', '分潤金額'].map((col) => (
            <div key={col} className="h-4 w-14 bg-slate-200 rounded" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-6 px-5 py-3.5 border-b border-slate-100">
            <div className="h-4 w-20 bg-slate-100 rounded" />
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-4 w-16 bg-slate-100 rounded" />
            <div className="h-4 w-28 bg-slate-100 rounded" />
            <div className="h-4 w-16 bg-slate-100 rounded" />
            <div className="h-4 w-8 bg-slate-100 rounded" />
            <div className="h-4 w-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

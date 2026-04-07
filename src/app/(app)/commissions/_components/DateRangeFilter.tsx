'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'

interface Props {
  startDate: string
  endDate: string
}

export function DateRangeFilter({ startDate, endDate }: Props) {
  const router = useRouter()
  const startRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const start = startRef.current?.value
    const end = endRef.current?.value
    if (start && end) {
      router.push(`/commissions?start=${start}&end=${end}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input
        ref={startRef}
        type="date"
        defaultValue={startDate}
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span className="text-slate-400 text-sm">～</span>
      <input
        ref={endRef}
        type="date"
        defaultValue={endDate}
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
      >
        查詢
      </button>
    </form>
  )
}

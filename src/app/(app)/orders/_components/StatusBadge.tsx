const STATUS_LABELS: Record<string, string> = {
  pending: '待處理',
  quote_issued: '已開報價單',
  invoice_issued: '已開發票',
  paid: '已付款',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  quote_issued: 'bg-blue-50 text-blue-700',
  invoice_issued: 'bg-amber-50 text-amber-700',
  paid: 'bg-green-50 text-green-700',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS.pending}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

export { STATUS_LABELS }

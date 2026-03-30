'use client'

import { advanceOrderStatus } from '../../actions'

export function AdvanceStatusButton({
  orderId,
  currentStatus,
  nextLabel,
}: {
  orderId: string
  currentStatus: string
  nextLabel: string
}) {
  return (
    <form action={advanceOrderStatus.bind(null, orderId, currentStatus)}>
      <button
        type="submit"
        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
      >
        標記為「{nextLabel}」
      </button>
    </form>
  )
}

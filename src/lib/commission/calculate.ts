/**
 * 分潤計算 — Pure Functions
 *
 * 規則：
 * - 起算點：收款日（payment_date）
 * - 排程：收款日後每季第一天，一年四次（共 4 期）
 * - 年份：以收款日起算（非日曆年），第一、二年 50%，第三年起 30%
 * - 僅主合約（is_main_contract = true）產生分潤，加購合約不產生
 */

// 季首月（0-indexed）：1月、4月、7月、10月
const QUARTER_START_MONTHS = [0, 3, 6, 9] as const

/**
 * 取得某日期所在的季度索引（0–3）
 */
function getQuarterIndex(month: number): number {
  return Math.floor(month / 3)
}

/**
 * 取得某日期之後的下一個季首日
 *
 * 例：2026-07-03（Q3）→ 2026-10-01（Q4 首日）
 *     2026-12-31（Q4）→ 2027-01-01（Q1 首日）
 */
export function getNextQuarterStart(date: Date): Date {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const quarterIndex = getQuarterIndex(month)
  const nextQuarterIndex = (quarterIndex + 1) % 4
  const yearOffset = quarterIndex === 3 ? 1 : 0
  return new Date(Date.UTC(year + yearOffset, QUARTER_START_MONTHS[nextQuarterIndex], 1))
}

/**
 * 產生從收款日起的 4 個季首日（分潤排程日期）
 *
 * 例：2026-07-03 → [2026-10-01, 2027-01-01, 2027-04-01, 2027-07-01]
 */
export function getDisbursementDates(paymentDate: Date): [Date, Date, Date, Date] {
  const dates: Date[] = []
  let current = getNextQuarterStart(paymentDate)

  for (let i = 0; i < 4; i++) {
    dates.push(current)
    current = getNextQuarterStart(current)
  }

  return dates as [Date, Date, Date, Date]
}

/**
 * 取得分潤費率
 * - 第一、二年：50%
 * - 第三年起：30%
 */
export function getCommissionRate(commissionYear: number): number {
  return commissionYear <= 2 ? 0.5 : 0.3
}

export interface CommissionItem {
  id: string
  subtotal: number
  isCommissionable: boolean
}

export interface CommissionScheduleItem {
  orderItemId: string
  itemSubtotal: number
  commissionAmount: number
}

export interface CommissionScheduleEntry {
  periodNumber: 1 | 2 | 3 | 4
  disbursementDate: Date
  commissionRate: number
  totalCommissionAmount: number
  items: CommissionScheduleItem[]
}

export interface GenerateCommissionInput {
  paymentDate: Date
  commissionYear: number  // 由 application 計算後傳入（第幾年的客戶關係）
  isMainContract: boolean
  items: CommissionItem[]
}

/**
 * 產生分潤排程（主合約付款後呼叫）
 *
 * 加購合約（isMainContract = false）回傳空陣列。
 * 每期金額 = 可分潤項目小計 × 費率 / 4
 */
export function generateCommissionSchedule(
  input: GenerateCommissionInput
): CommissionScheduleEntry[] {
  if (!input.isMainContract) return []

  const commissionableItems = input.items.filter((item) => item.isCommissionable)
  if (commissionableItems.length === 0) return []

  const rate = getCommissionRate(input.commissionYear)
  const disbursementDates = getDisbursementDates(input.paymentDate)

  return disbursementDates.map((disbursementDate, index) => {
    const scheduleItems: CommissionScheduleItem[] = commissionableItems.map((item) => ({
      orderItemId: item.id,
      itemSubtotal: item.subtotal,
      commissionAmount: roundHalfUp(item.subtotal * rate / 4),
    }))

    const totalCommissionAmount = scheduleItems.reduce(
      (sum, item) => sum + item.commissionAmount,
      0
    )

    return {
      periodNumber: (index + 1) as 1 | 2 | 3 | 4,
      disbursementDate,
      commissionRate: rate,
      totalCommissionAmount,
      items: scheduleItems,
    }
  })
}

/** 四捨五入到小數點後兩位 */
function roundHalfUp(value: number): number {
  return Math.round(value * 100) / 100
}

import { describe, it, expect } from 'vitest'
import {
  getNextQuarterStart,
  getDisbursementDates,
  getCommissionRate,
  generateCommissionSchedule,
} from './calculate'

// 建立 UTC 日期的 helper
function d(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day))
}

function dateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// ── getNextQuarterStart ───────────────────────────────────────

describe('getNextQuarterStart', () => {
  it('Q3 中間 → Q4 首日', () => {
    expect(dateStr(getNextQuarterStart(d(2026, 7, 3)))).toBe('2026-10-01')
  })

  it('Q4 最後一天 → 隔年 Q1 首日（跨年）', () => {
    expect(dateStr(getNextQuarterStart(d(2026, 12, 31)))).toBe('2027-01-01')
  })

  it('Q1 最後一天 → Q2 首日（跨月）', () => {
    expect(dateStr(getNextQuarterStart(d(2026, 3, 31)))).toBe('2026-04-01')
  })

  it('Q2 最後一天 → Q3 首日', () => {
    expect(dateStr(getNextQuarterStart(d(2026, 6, 30)))).toBe('2026-07-01')
  })

  it('剛好是季首日 → 下一個季首日（不重複當天）', () => {
    expect(dateStr(getNextQuarterStart(d(2026, 10, 1)))).toBe('2027-01-01')
  })

  it('年底跨年：Q4 首日 → 隔年 Q1', () => {
    expect(dateStr(getNextQuarterStart(d(2025, 12, 1)))).toBe('2026-01-01')
  })
})

// ── getDisbursementDates ──────────────────────────────────────

describe('getDisbursementDates', () => {
  it('收款 2026-07-03 → 四個正確的季首日', () => {
    const dates = getDisbursementDates(d(2026, 7, 3)).map(dateStr)
    expect(dates).toEqual([
      '2026-10-01',
      '2027-01-01',
      '2027-04-01',
      '2027-07-01',
    ])
  })

  it('收款 2026-12-31（Q4 最後一天）→ 跨年正確', () => {
    const dates = getDisbursementDates(d(2026, 12, 31)).map(dateStr)
    expect(dates).toEqual([
      '2027-01-01',
      '2027-04-01',
      '2027-07-01',
      '2027-10-01',
    ])
  })

  it('收款 2026-03-31（Q1 最後一天）→ 跨月正確', () => {
    const dates = getDisbursementDates(d(2026, 3, 31)).map(dateStr)
    expect(dates).toEqual([
      '2026-04-01',
      '2026-07-01',
      '2026-10-01',
      '2027-01-01',
    ])
  })

  it('永遠回傳 4 個日期', () => {
    expect(getDisbursementDates(d(2026, 1, 15))).toHaveLength(4)
  })
})

// ── getCommissionRate ─────────────────────────────────────────

describe('getCommissionRate', () => {
  it('第一年 → 50%', () => {
    expect(getCommissionRate(1)).toBe(0.5)
  })

  it('第二年 → 50%', () => {
    expect(getCommissionRate(2)).toBe(0.5)
  })

  it('第三年 → 30%', () => {
    expect(getCommissionRate(3)).toBe(0.3)
  })

  it('第四年以上 → 30%', () => {
    expect(getCommissionRate(4)).toBe(0.3)
    expect(getCommissionRate(10)).toBe(0.3)
  })
})

// ── generateCommissionSchedule ────────────────────────────────

describe('generateCommissionSchedule', () => {
  const baseItems = [
    { id: 'item-1', subtotal: 100000, isCommissionable: true },
    { id: 'item-2', subtotal: 50000, isCommissionable: true },
    { id: 'item-3', subtotal: 30000, isCommissionable: false },
  ]

  it('加購合約（isMainContract = false）→ 回傳空陣列', () => {
    const result = generateCommissionSchedule({
      paymentDate: d(2026, 7, 3),
      commissionYear: 1,
      isMainContract: false,
      items: baseItems,
    })
    expect(result).toEqual([])
  })

  it('沒有可分潤項目 → 回傳空陣列', () => {
    const result = generateCommissionSchedule({
      paymentDate: d(2026, 7, 3),
      commissionYear: 1,
      isMainContract: true,
      items: [{ id: 'item-1', subtotal: 100000, isCommissionable: false }],
    })
    expect(result).toEqual([])
  })

  it('主合約第一年 → 產生 4 期，費率 50%', () => {
    const result = generateCommissionSchedule({
      paymentDate: d(2026, 7, 3),
      commissionYear: 1,
      isMainContract: true,
      items: baseItems,
    })
    expect(result).toHaveLength(4)
    result.forEach((entry) => expect(entry.commissionRate).toBe(0.5))
  })

  it('主合約第二年 → 費率 50%', () => {
    const result = generateCommissionSchedule({
      paymentDate: d(2027, 7, 5),
      commissionYear: 2,
      isMainContract: true,
      items: baseItems,
    })
    result.forEach((entry) => expect(entry.commissionRate).toBe(0.5))
  })

  it('主合約第三年 → 費率 30%', () => {
    const result = generateCommissionSchedule({
      paymentDate: d(2028, 7, 6),
      commissionYear: 3,
      isMainContract: true,
      items: baseItems,
    })
    result.forEach((entry) => expect(entry.commissionRate).toBe(0.3))
  })

  it('每期金額 = 可分潤小計 × 費率 / 4', () => {
    // 可分潤項目：item-1(100000) + item-2(50000) = 150000
    // 第一年費率 50%，每期 = 150000 × 0.5 / 4 = 18750
    const result = generateCommissionSchedule({
      paymentDate: d(2026, 7, 3),
      commissionYear: 1,
      isMainContract: true,
      items: baseItems,
    })
    result.forEach((entry) => {
      expect(entry.totalCommissionAmount).toBe(18750)
    })
  })

  it('不可分潤項目不計入', () => {
    const result = generateCommissionSchedule({
      paymentDate: d(2026, 7, 3),
      commissionYear: 1,
      isMainContract: true,
      items: baseItems,
    })
    result.forEach((entry) => {
      const itemIds = entry.items.map((i) => i.orderItemId)
      expect(itemIds).not.toContain('item-3')
      expect(itemIds).toContain('item-1')
      expect(itemIds).toContain('item-2')
    })
  })

  it('分潤日期正確（收款 2026-07-03）', () => {
    const result = generateCommissionSchedule({
      paymentDate: d(2026, 7, 3),
      commissionYear: 1,
      isMainContract: true,
      items: baseItems,
    })
    const dates = result.map((e) => dateStr(e.disbursementDate))
    expect(dates).toEqual([
      '2026-10-01',
      '2027-01-01',
      '2027-04-01',
      '2027-07-01',
    ])
  })

  it('period_number 為 1–4', () => {
    const result = generateCommissionSchedule({
      paymentDate: d(2026, 7, 3),
      commissionYear: 1,
      isMainContract: true,
      items: baseItems,
    })
    expect(result.map((e) => e.periodNumber)).toEqual([1, 2, 3, 4])
  })

  it('第一/二年 vs 第三年費率切換：同一收款日不同年份', () => {
    const input = {
      paymentDate: d(2026, 7, 3),
      isMainContract: true,
      items: [{ id: 'item-1', subtotal: 120000, isCommissionable: true }],
    }
    const year2 = generateCommissionSchedule({ ...input, commissionYear: 2 })
    const year3 = generateCommissionSchedule({ ...input, commissionYear: 3 })

    // 每期：year2 = 120000 × 0.5 / 4 = 15000
    year2.forEach((e) => expect(e.totalCommissionAmount).toBe(15000))
    // 每期：year3 = 120000 × 0.3 / 4 = 9000
    year3.forEach((e) => expect(e.totalCommissionAmount).toBe(9000))
  })
})

import { NextRequest, NextResponse } from 'next/server'
import { processReminders } from '@/lib/reminders'

/**
 * GET /api/send-reminders?secret=xxx
 *
 * 用途：掃描即將到期的合約，寄出提醒信。
 * 保護：需帶 secret query param，對應 REMINDER_SECRET env var。
 *
 * 測試方式（本地）：
 *   curl "http://localhost:3000/api/send-reminders?secret=your-secret"
 *
 * 排程（Vercel Cron）：
 *   在 vercel.json 設定每天執行一次，帶 CRON_SECRET。
 */
export async function GET(req: NextRequest) {
  // 手動觸發：?secret=REMINDER_SECRET
  // Vercel Cron 自動觸發：Authorization: Bearer CRON_SECRET
  const secret = req.nextUrl.searchParams.get('secret')
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  const validManual = process.env.REMINDER_SECRET && secret === process.env.REMINDER_SECRET
  const validCron = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!validManual && !validCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const systemUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const debug = req.nextUrl.searchParams.get('debug') === '1'
  const force = req.nextUrl.searchParams.get('force') === '1'

  try {
    const result = await processReminders(systemUrl, debug, force)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

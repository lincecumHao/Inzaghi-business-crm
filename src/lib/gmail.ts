import { Resend } from 'resend'

/**
 * 需要的環境變數：
 *   RESEND_API_KEY   — Resend 後台取得
 *   GMAIL_SENDER_EMAIL — 寄件地址，需在 Resend 驗證過的網域（例如 no-reply@yourdomain.com）
 */

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY')
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendReminderEmail({
  to,
  customerName,
  contractEndDate,
  systemUrl,
}: {
  to: string
  customerName: string
  contractEndDate: string
  systemUrl: string
}) {
  const resend = getResend()
  const from = process.env.GMAIL_SENDER_EMAIL ?? 'no-reply@example.com'

  await resend.emails.send({
    from,
    to,
    subject: `[提醒] ${customerName} 合約即將於 ${contractEndDate} 到期`,
    html: `
      <p>您好，</p>
      <p>提醒您，<strong>${customerName}</strong> 的合約將於 <strong>${contractEndDate}</strong> 到期。</p>
      <p>請盡早安排續約事宜。</p>
      <p>
        <a href="${systemUrl}" style="
          display:inline-block;padding:8px 16px;
          background:#2563eb;color:white;
          border-radius:6px;text-decoration:none;font-size:14px;
        ">前往業務系統查看</a>
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
      <p style="font-size:12px;color:#94a3b8;">此信件由業務系統自動寄出，請勿直接回覆。</p>
    `,
  })
}

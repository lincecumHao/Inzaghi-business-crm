import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '業務系統',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}

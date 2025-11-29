import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Audio Communication - WebRTC',
  description: 'Real-time audio communication using WebRTC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


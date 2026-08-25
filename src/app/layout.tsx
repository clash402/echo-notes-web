import type { Metadata } from 'next'
import { Manrope, Newsreader } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
})

export const metadata: Metadata = {
  title: 'Echo Notes',
  description: 'Voice-first reflective note taking for Echo Notes.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-product="echo-notes">
      <body className={`${manrope.variable} ${newsreader.variable} min-h-screen bg-background text-foreground antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Edmund's Anaase AI - Real Reasoning Engine",
  description: 'Advanced AI with vector search, knowledge graphs, and explainable reasoning deployed on Vercel',
  keywords: 'AI, reasoning engine, vector search, knowledge graphs, GHChain, GOLDVAULT, Anaase',
  authors: [{ name: 'Edmund' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧠</text></svg>" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
```

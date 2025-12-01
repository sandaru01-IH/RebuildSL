import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rebuild Sri Lanka - Post-Disaster Damage Assessment Platform',
  description: 'National platform for damage assessment and resource allocation following major floods in Sri Lanka',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen transition-all duration-300 md:ml-[var(--sidebar-width,80px)]">{children}</main>
        <Footer />
      </body>
    </html>
  )
}


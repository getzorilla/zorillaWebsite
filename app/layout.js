import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

// Geist Mono carries everything structural: the nav, every heading, labels,
// tables, step names, code. Geist Sans is only for running paragraphs, which
// are the one thing a monospace makes harder rather than clearer. The mono is
// the same face andrewjungminkim.com is set in.
const sans = Geist({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })
import catalog from '@/public/catalog.json'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

// the count comes off the catalogue so it cannot drift from what ships
const description =
  `Fully local automation, no strings attached. Reads smart contracts, with web3 steps built in. ${catalog.integrations.length} API integrations, or build your own.`

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zorilla.io'),
  title: 'Zorilla: Web2/3 workflow automation, fully local.',
  description,
  icons: { icon: [{ url: '/favicon.ico', sizes: 'any' }, { url: '/logo.svg', type: 'image/svg+xml' }], apple: '/apple-icon.png' },
  openGraph: {
    type: 'website',
    siteName: 'Zorilla',
    title: 'Automations that run on your machine',
    description,
    url: '/',
    images: [{ url: '/og-2.png', width: 1200, height: 630, alt: 'Zorilla: automations that run on your machine' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Automations that run on your machine',
    description,
    creator: '@4aykk',
    images: ['/og-2.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}

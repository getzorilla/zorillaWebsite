import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const description =
  'Fully local automation, no strings attached. Reads smart contracts, with web3 steps built in. 16 API integrations, or build your own.'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zorilla.io'),
  title: 'zorilla: Fully local automation, onchain',
  description,
  icons: { icon: [{ url: '/favicon.ico', sizes: 'any' }, { url: '/logo.svg', type: 'image/svg+xml' }], apple: '/apple-icon.png' },
  openGraph: {
    type: 'website',
    siteName: 'zorilla',
    title: 'Automations that run on your machine',
    description,
    url: '/',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'zorilla: automations that run on your machine' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Automations that run on your machine',
    description,
    creator: '@4aykk',
    images: ['/og.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}

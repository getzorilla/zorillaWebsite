import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'zorilla: Fully local automation, onchain',
  description: 'Fully local automation, no strings attached. Reads smart contracts, with web3 steps built in. 15 API integrations, or build your own.',
  icons: { icon: [{ url: '/favicon.ico', sizes: 'any' }, { url: '/logo.svg', type: 'image/svg+xml' }], apple: '/apple-icon.png' },
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

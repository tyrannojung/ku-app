import type { Metadata } from 'next'
import { Container } from '@/util/bootstrap';
import 'bootstrap/dist/css/bootstrap.css';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'Next.js',
    description: 'The React Framework for the Web',
    url: 'https://nextjs.org',
    siteName: 'Next.js',
    images: [
      {
        url: 'https://nextjs.org/og.png',
        width: 800,
        height: 600,
      },
      {
        url: 'https://nextjs.org/og-alt.png',
        width: 1800,
        height: 1600,
        alt: 'My custom alt',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html>
      <body>
        <Container className="py-4">
          {children}
        </Container>
      </body>
    </html>
  )
}

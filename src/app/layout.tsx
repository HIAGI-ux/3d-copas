import type { Metadata } from 'next'
import { Nunito, Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '600', '700', '800', '900'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    template: '%s | 3D Copas',
    default: '3D Copas – Impresión 3D a pedido desde Balcarce',
  },
  description:
    'Cortantes para cerámica y galletitas, sellos, luces personalizadas y más. Hecho a pedido en Balcarce, Buenos Aires. Envíos a toda la Argentina.',
  metadataBase: new URL('https://3dcopas.com.ar'),
  keywords: [
    'impresión 3D',
    'cortantes cerámica',
    'cortantes galletitas',
    'sellos personalizados',
    'luces 3D',
    'Balcarce',
    'Buenos Aires',
    'Argentina',
  ],
  authors: [{ name: '3D Copas', url: 'https://3dcopas.com.ar' }],
  creator: '3D Copas',
  openGraph: {
    title: '3D Copas – Impresión 3D a pedido desde Balcarce',
    description:
      'Cortantes para cerámica y galletitas, sellos, luces personalizadas y más. Envíos a toda la Argentina.',
    url: 'https://3dcopas.com.ar',
    siteName: '3D Copas',
    type: 'website',
    locale: 'es_AR',
    images: [
      {
        url: '/logo-3d-copas.png',
        width: 512,
        height: 512,
        alt: '3D Copas – Impresión 3D en Balcarce',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '3D Copas – Impresión 3D a pedido desde Balcarce',
    description: 'Cortantes para cerámica y galletitas, sellos, luces personalizadas y más.',
    images: ['/logo-3d-copas.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://3dcopas.com.ar',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-AR" className={`${nunito.variable} ${inter.variable}`}>
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0F1B3D',
              color: '#FAF7EF',
              fontFamily: 'var(--font-nunito)',
            },
            success: {
              iconTheme: { primary: '#3E9B47', secondary: '#FAF7EF' },
            },
            error: {
              iconTheme: { primary: '#9C2A2A', secondary: '#FAF7EF' },
            },
          }}
        />
      </body>
    </html>
  )
}

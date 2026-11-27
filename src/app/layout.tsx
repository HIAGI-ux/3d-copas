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
  title: '3D Copas | Impresión 3D en Balcarce',
  description: 'Cortantes para cerámica y galletitas, sellos, luces personalizadas y más. Hecho a pedido en Balcarce. Envíos a toda la Argentina.',
  openGraph: {
    title: '3D Copas | Impresión 3D en Balcarce',
    description: 'Cortantes para cerámica y galletitas, sellos, luces personalizadas y más. Hecho a pedido en Balcarce. Envíos a toda la Argentina.',
    type: 'website',
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary_large_image',
    title: '3D Copas | Impresión 3D en Balcarce',
    description: 'Cortantes para cerámica y galletitas, sellos, luces personalizadas y más.',
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

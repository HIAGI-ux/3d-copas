import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/cuenta'],
      },
    ],
    sitemap: 'https://3dcopas.com.ar/sitemap.xml',
  }
}

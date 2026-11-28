// src/components/store/JsonLdSchema.tsx
// Renders JSON-LD structured data for SEO.

interface LocalBusinessSchemaProps {
  url?: string
  logoUrl?: string
}

export function LocalBusinessSchema({
  url = 'https://3dcopas.com.ar',
  logoUrl = 'https://3dcopas.com.ar/logo-3d-copas.png',
}: LocalBusinessSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: '3D Copas',
    description:
      'Impresión 3D a pedido desde Balcarce. Cortantes para cerámica y galletitas, sellos, luces personalizadas y más. Envíos a toda la Argentina.',
    url,
    logo: logoUrl,
    image: logoUrl,
    telephone: '+5492266466387',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Balcarce',
      addressLocality: 'Balcarce',
      addressRegion: 'Buenos Aires',
      addressCountry: 'AR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -37.8457,
      longitude: -58.2572,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '20:00',
    },
    priceRange: '$',
    paymentAccepted: 'Cash, Transfer',
    currenciesAccepted: 'ARS',
    areaServed: {
      '@type': 'Country',
      name: 'Argentina',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface ProductSchemaProps {
  name: string
  description?: string
  imageUrl?: string
  price?: number
  slug: string
  baseUrl?: string
}

export function ProductSchema({
  name,
  description,
  imageUrl,
  price,
  slug,
  baseUrl = 'https://3dcopas.com.ar',
}: ProductSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description || name,
    brand: {
      '@type': 'Brand',
      name: '3D Copas',
    },
    manufacturer: {
      '@type': 'Organization',
      name: '3D Copas',
    },
    url: `${baseUrl}/producto/${slug}`,
  }

  if (imageUrl) schema.image = imageUrl

  if (price) {
    schema.offers = {
      '@type': 'Offer',
      priceCurrency: 'ARS',
      price: price,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: '3D Copas',
      },
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/_next/',
        '/private/',
        '/temp/',
        '/checkout/',
        '/payment/',
        '/cart/',
        '/profile/',
        '/login/',
        '/register/',
        '/forgot-password/',
      ],
    },
    sitemap: 'https://polysmart.nghiaht.io.vn/sitemap.xml',
    host: 'https://polysmart.nghiaht.io.vn',
  }
} 
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import Header from "@/components/client/Header";
import SmoothScrollProvider from "@/components/client/SmoothScrollProvider";
import Footer from "@/components/client/Footer";
import FontOptimizer from "@/components/client/FontOptimizer";
// Import CSS giống như admin để sửa lỗi Tailwind
import "@/css/satoshi.css";
import "@/css/style.css";
import "@/css/dashboard-custom.css";
import "@/css/font-optimization.css";
// Import CSS cho client
import "./(client)/globals.css";
import ReduxProvider from '../providers/ReduxProvider';
import ChatbotAI from '@/components/client/ChatbotAI';
import VoucherPopup from '@/components/client/VoucherPopup';
import { GoogleOAuthProvider } from '@react-oauth/google';

const inter = Inter({ 
  subsets: ['latin', 'vietnamese'],
  display: 'swap', // Tối ưu hóa font loading
  preload: true,   // Preload font để tránh chặn render
  fallback: ['system-ui', 'Arial', 'sans-serif'] // Fallback fonts
});

export const metadata: Metadata = {
  metadataBase: new URL('https://polysmart.nghiaht.io.vn'),
  title: {
    default: "Poly Smart - Đại lý ủy quyền Apple chính hãng | iPhone, iPad, MacBook",
    template: "%s | Poly Smart"
  },
  icons: {
    icon: [
      { url: '/images/logo/logo.png', type: 'image/png' },
    ],
    shortcut: '/images/logo/logo.png',
    apple: '/images/logo/logo.png',
  },
  description: "Poly Smart - Đại lý ủy quyền Apple chính hãng tại Việt Nam. Chuyên cung cấp iPhone, iPad, MacBook, Apple Watch, AirPods chính hãng với giá tốt nhất. Giao hàng toàn quốc, bảo hành chính hãng.",
  keywords: [
    "iPhone chính hãng",
    "iPad chính hãng", 
    "MacBook chính hãng",
    "Apple Watch",
    "AirPods",
    "đại lý Apple",
    "cửa hàng Apple",
    "Poly Smart",
    "Apple Việt Nam",
    "iPhone 15",
    "iPhone 15 Pro",
    "iPhone 15 Pro Max",
    "iPad Pro",
    "MacBook Pro",
    "MacBook Air",
    "Apple Store",
    "iPhone giá rẻ",
    "iPad giá rẻ",
    "MacBook giá rẻ",
    "Apple chính hãng",
    "bảo hành Apple"
  ],
  authors: [{ name: "Poly Smart", url: "https://polysmart.nghiaht.io.vn" }],
  creator: "Poly Smart",
  publisher: "Poly Smart",
  category: "Electronics",
  classification: "Technology",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'vi-VN': '/',
      'en-US': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://polysmart.nghiaht.io.vn',
    siteName: 'Poly Smart',
    title: 'Poly Smart - Đại lý ủy quyền Apple chính hãng',
    description: 'Đại lý ủy quyền Apple chính hãng tại Việt Nam. Chuyên cung cấp iPhone, iPad, MacBook, Apple Watch, AirPods với giá tốt nhất.',
    images: [
      {
        url: '/images/ogapple.png',
        width: 1200,
        height: 630,
        alt: 'Poly Smart - Đại lý Apple chính hãng tại Việt Nam',
        type: 'image/png',
      },
      {
        url: '/images/logo/logo.png',
        width: 1200,
        height: 630,
        alt: 'Poly Smart - Logo',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Poly Smart - Đại lý ủy quyền Apple chính hãng',
    description: 'Đại lý ủy quyền Apple chính hãng tại Việt Nam. Chuyên cung cấp iPhone, iPad, MacBook, Apple Watch, AirPods với giá tốt nhất.',
    creator: '@polysmart',
    site: '@polysmart',
    images: [
      {
        url: '/images/ogapple.png',
        alt: 'Poly Smart - Đại lý Apple chính hãng tại Việt Nam',
        width: 1200,
        height: 630,
      }
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Poly Smart',
    'apple-mobile-web-app-icon': '/images/logo/logo.png',
    'application-name': 'Poly Smart',
    'msapplication-TileColor': '#007AFF',
    'msapplication-config': '/browserconfig.xml',
    'msapplication-TileImage': '/images/logo/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Favicon and App Icons */}
        <link rel="icon" href="/images/logo/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/images/logo/logo.png" />
        <link rel="apple-touch-icon" href="/images/logo/logo.png" />
        
        {/* Preconnect to external domains for performance - chỉ giữ lại những gì cần thiết */}
        <link rel="preconnect" href="https://polysmart.nghiaht.io.vn" />
        <link rel="dns-prefetch" href="https://polysmart.nghiaht.io.vn" />
        <link rel="preconnect" href="https://poly.nghiaht.io.vn" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://poly.nghiaht.io.vn" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#007AFF" />
        <meta name="msapplication-TileColor" content="#007AFF" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* SEO Meta Tags */}
        <meta name="author" content="Poly Smart" />
        <meta name="copyright" content="Poly Smart" />
        <meta name="language" content="Vietnamese" />
        <meta name="geo.region" content="VN" />
        <meta name="geo.placename" content="Ho Chi Minh City" />
        <meta name="geo.position" content="10.8231;106.6297" />
        <meta name="ICBM" content="10.8231, 106.6297" />
        
        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Poly Smart",
              "url": "https://polysmart.nghiaht.io.vn",
              "description": "Đại lý ủy quyền Apple chính hãng tại Việt Nam",
              "foundingDate": "2020",
              "logo": "https://polysmart.nghiaht.io.vn/images/logo/logo.png",
              "image": "https://polysmart.nghiaht.io.vn/images/logo/logo.png",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "VN",
                "addressLocality": "Ho Chi Minh City",
                "addressRegion": "Ho Chi Minh"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+84-xxx-xxx-xxxx",
                "contactType": "customer service",
                "availableLanguage": "Vietnamese"
              },
              "sameAs": [
                "https://facebook.com/polysmart",
                "https://instagram.com/polysmart",
                "https://youtube.com/polysmart"
              ]
            })
          }}
        />
        
        {/* Structured Data for LocalBusiness */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Poly Smart",
              "description": "Đại lý ủy quyền Apple chính hãng tại Việt Nam",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "123 Đường ABC",
                "addressLocality": "Ho Chi Minh City",
                "addressRegion": "Ho Chi Minh",
                "postalCode": "70000",
                "addressCountry": "VN"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 10.8231,
                "longitude": 106.6297
              },
              "url": "https://polysmart.nghiaht.io.vn",
              "telephone": "+84-xxx-xxx-xxxx",
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": [
                    "Monday",
                    "Tuesday", 
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday"
                  ],
                  "opens": "08:00",
                  "closes": "22:00"
                }
              ],
              "priceRange": "$$",
              "servesCuisine": "Electronics",
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Apple Products",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Product",
                      "name": "iPhone 15 Pro Max",
                      "brand": {
                        "@type": "Brand",
                        "name": "Apple"
                      }
                    }
                  }
                ]
              }
            })
          }}
        />

        {/* Structured Data for WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Poly Smart",
              "url": "https://polysmart.nghiaht.io.vn",
              "description": "Đại lý ủy quyền Apple chính hãng tại Việt Nam",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://polysmart.nghiaht.io.vn/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
          <ReduxProvider>
            <FontOptimizer>
              <Header />
              <SmoothScrollProvider>
              <main className="pt-0">
                {children}
              </main>
              </SmoothScrollProvider>
              <Footer />
              <ChatbotAI />
              <VoucherPopup />
            </FontOptimizer>
          </ReduxProvider>
         </GoogleOAuthProvider>
      </body>
    </html>
  );
}
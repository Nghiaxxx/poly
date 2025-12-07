/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bỏ standalone mode để tránh lỗi WebAssembly memory
  // output: 'standalone',

  images: {
    // domains đã deprecated, chỉ giữ remotePatterns
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/images/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3000',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3001',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'polysmart.nghiaht.io.vn',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'poly.nghiaht.io.vn',
        pathname: '/images/**',
      }
    ],
    unoptimized: false, // Bật lại tối ưu hóa ảnh để cải thiện performance
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/:path*`
      }
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          }
        ]
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ]
      }
    ];
  },
  // Cấu hình cho development
  experimental: {
    // allowedDevOrigins: ['polysmart.nghiaht.io.vn', 'localhost:3001'] // Removed for Next.js 15 compatibility
    // Tắt một số tính năng tốn memory
    // webVitalsAttribution đã bị deprecated trong Next.js 14
  },
  // Tối ưu hóa để giảm memory usage
  swcMinify: true,
  compress: true,
  // Đảm bảo CSS được xử lý đúng trong production
  productionBrowserSourceMaps: false, // Tắt source maps để tránh conflict
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000',
    NEXT_PUBLIC_IMAGE_URL: process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:3000',
    NEXT_PUBLIC_STORAGE_URL: process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:3000'
  }
};

module.exports = nextConfig;
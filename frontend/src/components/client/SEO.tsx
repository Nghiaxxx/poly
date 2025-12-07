import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

const SEO: React.FC<SEOProps> = ({
  title = "Poly Smart - Đại lý ủy quyền Apple chính hãng",
  description = "Poly Smart - Đại lý ủy quyền Apple chính hãng tại Việt Nam. Chuyên cung cấp iPhone, iPad, MacBook, Apple Watch, AirPods chính hãng với giá tốt nhất.",
  keywords = ["iPhone", "iPad", "MacBook", "Apple", "chính hãng", "Poly Smart"],
  image = "/images/logo/logo.png",
  url = "https://polysmart.nghiaht.io.vn",
  type = "website",
  publishedTime,
  modifiedTime,
  author = "Poly Smart",
  section,
  tags = []
}) => {
  const fullTitle = title.includes("Poly Smart") ? title : `${title} | Poly Smart`;
  const fullUrl = url.startsWith('http') ? url : `https://polysmart.nghiaht.io.vn${url}`;
  const fullImage = image.startsWith('http') ? image : `https://polysmart.nghiaht.io.vn${image}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={[...keywords, "iPhone chính hãng", "iPad chính hãng", "MacBook chính hãng", "Apple Việt Nam"].join(', ')} />
      <meta name="author" content={author} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Poly Smart" />
      <meta property="og:locale" content="vi_VN" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content="@polysmart" />
      
      {/* Article specific meta tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && section && (
        <meta property="article:section" content={section} />
      )}
      {type === 'article' && tags.length > 0 && (
        <meta property="article:tag" content={tags.join(', ')} />
      )}
      
      {/* Product specific meta tags */}
      {type === 'product' && (
        <>
          <meta property="product:price:amount" content="" />
          <meta property="product:price:currency" content="VND" />
          <meta property="product:availability" content="in stock" />
        </>
      )}
      
      {/* Additional SEO meta tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      
      {/* Geo meta tags */}
      <meta name="geo.region" content="VN" />
      <meta name="geo.placename" content="Ho Chi Minh City" />
      <meta name="geo.position" content="10.8231;106.6297" />
      <meta name="ICBM" content="10.8231, 106.6297" />
      
      {/* Language and region */}
      <meta name="language" content="Vietnamese" />
      <meta name="geo.region" content="VN" />
      
      {/* Mobile optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Poly Smart" />
      
      {/* Performance optimization */}
      <link rel="preconnect" href="https://polysmart.nghiaht.io.vn" />
      <link rel="dns-prefetch" href="https://polysmart.nghiaht.io.vn" />
    </Head>
  );
};

export default SEO;

// Predefined SEO configurations for common pages
export const productSEO = (product: any) => ({
  title: `${product.name} - ${product.brand || 'Apple'} chính hãng`,
  description: `${product.name} chính hãng Apple tại Poly Smart. ${product.description || 'Giá tốt nhất, giao hàng toàn quốc, bảo hành chính hãng.'}`,
  keywords: [
    product.name,
    product.brand || 'Apple',
    'chính hãng',
    'Poly Smart',
    'giá tốt',
    'giao hàng toàn quốc'
  ],
  type: 'product' as const,
  structuredData: {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Apple"
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "VND",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Poly Smart"
      }
    },
    "aggregateRating": product.rating ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount || 0
    } : undefined
  }
});

export const categorySEO = (category: any) => ({
  title: `${category.name} chính hãng Apple - Poly Smart`,
  description: `${category.name} chính hãng Apple tại Poly Smart. Đa dạng mẫu mã, giá tốt nhất, giao hàng toàn quốc.`,
  keywords: [
    category.name,
    'Apple',
    'chính hãng',
    'Poly Smart',
    'giá tốt'
  ],
  type: 'website' as const,
  structuredData: {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category.name,
    "description": `${category.name} chính hãng Apple`,
    "url": `https://polysmart.nghiaht.io.vn/categories/${category.slug}`
  }
});

export const articleSEO = (article: any) => ({
  title: article.title,
  description: article.excerpt || article.description,
  keywords: article.tags || [],
  type: 'article' as const,
  structuredData: {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt || article.description,
    "image": article.image,
    "author": {
      "@type": "Organization",
      "name": "Poly Smart"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Poly Smart",
      "logo": {
        "@type": "ImageObject",
        "url": "https://polysmart.nghiaht.io.vn/images/logo/logo.png"
      }
    },
    "datePublished": article.publishedAt,
    "dateModified": article.updatedAt
  }
}); 
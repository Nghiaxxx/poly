import { Metadata } from 'next';

interface ProductMetadataProps {
  product: {
    name: string;
    description: string;
    price: number;
    images?: string[];
  };
}

export function generateProductMetadata({ product }: ProductMetadataProps): Metadata {
  return {
    title: `${product.name} | Poly Smart`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      type: 'website',
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(product.name)}&description=${encodeURIComponent(product.description)}&type=product`,
          width: 1200,
          height: 630,
          alt: `${product.name} - Poly Smart`,
        },
        // Fallback to static image if dynamic generation fails
        {
          url: '/images/ogapple.png',
          width: 1200,
          height: 630,
          alt: 'Poly Smart - Đại lý Apple chính hãng',
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(product.name)}&description=${encodeURIComponent(product.description)}&type=product`,
          alt: `${product.name} - Poly Smart`,
        }
      ],
    },
  };
}

// Example usage in a page component:
/*
import { generateProductMetadata } from './metadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);
  return generateProductMetadata({ product });
}
*/ 
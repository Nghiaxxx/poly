import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
}

export default function Breadcrumbs({ items, showHome = true }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Generate breadcrumbs from pathname if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    if (showHome) {
      breadcrumbs.push({ label: 'Trang chủ', href: '/' });
    }
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      
      // Convert path to readable label
      let label = path;
      switch (path) {
        case 'product':
          label = 'Sản phẩm';
          break;
        case 'categories':
          label = 'Danh mục';
          break;
        case 'cart':
          label = 'Giỏ hàng';
          break;
        case 'payments':
          label = 'Thanh toán';
          break;
        case 'profile':
          label = 'Tài khoản';
          break;
        case 'news':
          label = 'Tin tức';
          break;
        case 'search':
          label = 'Tìm kiếm';
          break;
        case 'login':
          label = 'Đăng nhập';
          break;
        case 'register':
          label = 'Đăng ký';
          break;
        default:
          // Capitalize first letter and replace hyphens/underscores with spaces
          label = path
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
      }
      
      // Don't add href for the last item (current page)
      const isLast = index === paths.length - 1;
      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbItems = items || generateBreadcrumbs();
  
  // Generate structured data for breadcrumbs
  const generateStructuredData = () => {
    const itemListElement = breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": item.href ? `https://polysmart.nghiaht.io.vn${item.href}` : undefined
    }));
    
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": itemListElement
    };
  };
  
  if (breadcrumbItems.length <= 1) {
    return null;
  }
  
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData())
        }}
      />
      
      {/* Visual Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="py-4 px-6 bg-gray-50">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          {breadcrumbItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <svg
                  className="w-4 h-4 mx-2 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-blue-600 hover:underline transition-colors"
                  aria-current={index === breadcrumbItems.length - 1 ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="text-gray-900 font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

// Helper function to create breadcrumbs for specific pages
export const createProductBreadcrumbs = (product: any) => [
  { label: 'Trang chủ', href: '/' },
  { label: 'Sản phẩm', href: '/product' },
  { label: product.category || 'Danh mục', href: `/categories/${product.categorySlug}` },
  { label: product.name }
];

export const createCategoryBreadcrumbs = (category: any) => [
  { label: 'Trang chủ', href: '/' },
  { label: 'Danh mục', href: '/categories' },
  { label: category.name }
];

export const createArticleBreadcrumbs = (article: any) => [
  { label: 'Trang chủ', href: '/' },
  { label: 'Tin tức', href: '/news' },
  { label: article.title }
]; 
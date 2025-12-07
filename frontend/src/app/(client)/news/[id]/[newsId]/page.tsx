import { Metadata, ResolvingMetadata } from 'next';
import NewsDetailComponent from './NewsDetail';
import { getApiUrl, getBaseUrl } from "@/config/api";

// Hàm lấy dữ liệu tin tức từ API
async function getNewsDetail(newsId: string) {
  try {
    const res = await fetch(getApiUrl(`news/${newsId}`), {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching news:', error);
    return null;
  }
}

// Metadata động
export async function generateMetadata(
  { params }: { params: Promise<{ id: string; newsId: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id, newsId } = await params;
  
  // Lấy tin tức
  const news = await getNewsDetail(newsId);
  
  // Nếu không tìm thấy tin tức
  if (!news) {
    return {
      title: 'Không tìm thấy tin tức',
      description: 'Tin tức không tồn tại hoặc đã bị xóa',
    };
  }

  // Lấy metadata gốc
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: news.tieu_de,
    description: news.mo_ta,
    authors: [{ name: news.nguoi_dang?.ho_ten || 'Admin' }],
    openGraph: {
      title: news.tieu_de,
      description: news.mo_ta,
      type: 'article',
      publishedTime: news.ngay,
      authors: news.nguoi_dang?.ho_ten || 'Admin',
      images: [
        {
          url: `${getBaseUrl()}/${news.hinh}`,
          width: 1200,
          height: 630,
          alt: news.tieu_de,
        },
        ...previousImages,
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: news.tieu_de,
      description: news.mo_ta,
      images: [`${getBaseUrl()}/${news.hinh}`],
    },
    alternates: {
      canonical: `https://polysmart.nghiaht.io.vn/news/${id}/${newsId}`,
    },
  };
}

// Page component
export default async function NewsDetailPage({ 
  params 
}: { 
  params: Promise<{ newsId: string }> 
}) {
  const { newsId } = await params;
  return <NewsDetailComponent newsId={newsId} />;
} 
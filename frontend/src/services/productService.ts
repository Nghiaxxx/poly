export async function fetchAllProducts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/api/products?an_hien=true`);
  if (!res.ok) throw new Error('Không thể lấy danh sách sản phẩm');
  return res.json();
}

export async function trackUserEvent(eventType: string, productId: string, userId: string, searchKeyword?: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const response = await fetch(`${backendUrl}/api/track-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, productId, userId, searchKeyword }),
    });
    
    if (!response.ok) {

    }
    
    return response.json();
  } catch (error) {

    // Không throw error để không ảnh hưởng đến UX
  }
}

export async function fetchRecommendedProducts(userId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/api/recommendations/${userId}`);
  if (!res.ok) throw new Error('Không thể lấy sản phẩm gợi ý');
  return res.json();
} 
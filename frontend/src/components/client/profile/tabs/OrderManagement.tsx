import React, { useRef, useEffect } from 'react';
import useOrderManagement from '../hooks/useOrderManagement';
import ReviewModal from '@/components/client/ReviewModal';

export default function OrderManagement() {
  const {
    orders,
    orderTab,
    handleOrderTabChange,
    returnRequests,
    loadingReturns,
    showReturnForm,
    selectedReturnOrder,
    returnReason,
    returnDescription,
    returnEmail,
    selectedReturnProducts,
    returnedProducts,
    requestedProducts,
    handleReturnOrder,
    handleCloseReturnForm,
    handleProductSelection,
    handleSelectAllProducts,
    calculateRefundAmount,
    handleSubmitReturn,
    needRefund,
    mapReturnStatus,
    getOrderTabCounts,
    ORDER_TABS,
    getVnColorName,
    handleConfirmReceipt,
    handleCancelOrder,
    handleBuyAgain,
    canReturnOrder,
    canReviewOrder,
    handleOpenReviewModal,
    handleCloseReviewModal,
    canBuyAgain, 
    isReviewModalOpen,
    selectedProduct,
    userReviews,
    canReviewProduct,
    getReviewableProducts,
    handleReviewSubmitted,
    setReturnReason,
    setReturnDescription,
    setReturnEmail,
  } = useOrderManagement();

  const modalRef = useRef<HTMLDivElement>(null);

  // Filter orders based on active tab
  const filteredOrders =
    orderTab === "all"
      ? orders
      : orderTab === "returns"
      ? [] // Không hiển thị orders trong tab returns
      : orders.filter((order) => order.status === orderTab);

  // Manage scroll behavior for modal
  useEffect(() => {
    if (showReturnForm) {
      // Disable body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Focus modal for immediate scroll capability
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
      
      // Enable wheel events for modal
      const handleWheel = (e: WheelEvent) => {
        const modalContent = document.querySelector('[data-modal-content="true"]');
        if (modalContent && modalContent.contains(e.target as Node)) {
          e.stopPropagation();
        }
      };

      document.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        // Restore body scroll when modal closes
        document.body.style.overflow = '';
        document.removeEventListener('wheel', handleWheel);
      };
    }
  }, [showReturnForm]);

  return (
    <>
      <div className="sm:px-0">
        <div className="max-w-[70.5rem] mx-auto">
          {/* Tabs đơn hàng */}
          <div className="overflow-x-auto">
            <div className="max-w-[70.5rem] mx-auto flex gap-10 sm:gap-3 border-b border-[#f2f2f2] bg-white pt-2 flex-wrap sm:flex-nowrap">
              {ORDER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`relative flex items-center justify-center min-w-[80px] py-2 px-1 sm:px-2 text-sm font-medium transition border-b-2 outline-none focus:outline-none text-center whitespace-nowrap ${
                    orderTab === tab.key
                      ? "border-[#0066CC] text-[#0066CC] bg-white"
                      : "border-transparent text-gray-700 hover:text-[#0066CC] bg-white"
                  }`}
                  onClick={() => handleOrderTabChange(tab.key)}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="ml-2 inline-block min-w-[20px] px-1 text-xs rounded-full bg-[#0066CC] text-white font-bold align-middle">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Search */}
          <div className="bg-white py-4 border-b border-[#f2f2f2]">
            <input
              type="text"
              placeholder="Bạn có thể tìm kiếm theo Tên Sản phẩm"
              className="w-full border border-[#e5e5e5] rounded text-base px-5 py-3 focus:outline-none focus:border-[#0066CC] bg-[#fafafa]"
            />
          </div>
        </div>
        
        {/* Danh sách đơn hàng hoặc yêu cầu trả hàng */}
        <div className="flex flex-col gap-6 mt-6">
          {orderTab === "returns" ? (
            // Hiển thị danh sách yêu cầu trả hàng
            loadingReturns ? (
              <div className="text-center py-8">Đang tải danh sách yêu cầu trả hàng...</div>
            ) : returnRequests.length === 0 ? (
              <div className="text-center text-gray-400 py-8 bg-white rounded">
                Bạn chưa có yêu cầu trả hàng nào.
              </div>
            ) : (
              returnRequests.map((request) => {
                const statusInfo = mapReturnStatus(request.status);
                return (
                  <div key={request._id} className="bg-white rounded shadow-sm border border-[#f2f2f2] p-6">
                    {/* Header với trạng thái */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          Đơn hàng: {request.orderId?._id?.slice(-8)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Ngày tạo: {new Date(request.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} ${statusInfo.bgColor}`}>
                        {statusInfo.text}
                      </span>
                    </div>

                    {/* Thông tin sản phẩm được trả */}
                    {request.selectedProducts && request.selectedProducts.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Sản phẩm trả hàng:</h4>
                        <div className="space-y-3">
                          {request.selectedProducts.map((product: any, index: number) => (
                            <div key={index} className="flex items-center gap-4 bg-gray-50 p-3 rounded">
                              <img
                                src={product.image || "/placeholder.jpg"}
                                alt="product"
                                className="w-16 h-16 object-contain border rounded bg-white"
                              />
                              <div className="flex-1">
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-500">
                                  Phân loại: {getVnColorName(product.colorName)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Số lượng: x{product.quantity}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-[#0066CC]">
                                  {product.price?.toLocaleString()}₫
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lý do trả hàng */}
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Lý do trả hàng:</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">{request.reason}</p>
                    </div>

                    {/* Mô tả */}
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Mô tả chi tiết:</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">{request.description}</p>
                    </div>

                    {/* Thông tin hoàn tiền */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Số tiền hoàn lại:</span>
                        <span className="font-bold text-blue-500 text-lg">
                           {request.refundAmount?.toLocaleString() || request.order?.totalAmount?.toLocaleString()}₫
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Hoàn tiền vào:</span>
                        <span className="text-gray-800">Số dư Ví PolyPay</span>
                      </div>
                    </div>

                    {/* Ghi chú admin (nếu có) */}
                    {request.adminNotes && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Ghi chú từ admin:</h4>
                        <p className="text-gray-700 bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                          {request.adminNotes}
                        </p>
                      </div>
                    )}

                    {/* Thời gian xử lý */}
                    {request.processedAt && (
                      <div className="text-sm text-gray-500">
                        Xử lý lúc: {new Date(request.processedAt).toLocaleString("vi-VN")}
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            // Hiển thị danh sách đơn hàng
            <>
              {filteredOrders.length === 0 && (
                <div className="text-center text-gray-400 py-8 bg-white rounded">
                  {orders.length === 0 ? "Không có đơn hàng nào." : "Không có đơn hàng nào phù hợp với bộ lọc."}
                </div>
              )}
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded shadow-sm border border-[#f2f2f2] p-0 w-full"
                >
                  {/* Shop + trạng thái */}
                  <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-[#f2f2f2]">
                    <div className="flex items-center gap-2">
                      {order.delivered && (
                        <span className="flex items-center text-green-600 text-sm font-medium">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12l2 2 4-4"
                            />
                          </svg>
                          Giao hàng thành công
                        </span>
                      )}
                      {/* Hiển thị trạng thái thanh toán */}
                      {order.status !== "delivered" &&
                        !order.delivered &&
                        (order.paymentStatus === "paid" ? (
                          <span className="ml-4 text-green-600 text-xs font-medium flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Đã thanh toán
                          </span>
                        ) : order.paymentMethod === "cod" ? (
                          <span className="ml-4 text-gray-500 text-xs">
                            Thanh toán khi nhận hàng (COD)
                          </span>
                        ) : (
                          <span className="ml-4 text-yellow-600 text-xs">
                            Chưa thanh toán
                          </span>
                        ))}
                    </div>
                    <span
                      className={`${order.statusColor} text-sm font-bold uppercase`}
                    >
                      {order.statusText}
                    </span>
                  </div>
                  {/* Hiển thị tất cả sản phẩm trong đơn hàng */}
                  {order.items &&
                    order.items.length > 0 &&
                    order.items.map((item: any, idx: number) => (
                      <div
                        key={item._id || idx}
                        className="flex items-center gap-4 px-6 py-4 border-b border-[#f2f2f2] last:border-b-0"
                      >
                        <img
                          src={item.image}
                          alt="product"
                          className="w-20 h-20 object-contain border rounded bg-white"
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="font-medium text-base truncate text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Phân loại hàng: {[
                              item.colorName && getVnColorName(item.colorName),
                              item.dung_luong
                            ].filter(Boolean).join(', ')}
                          </div>
                          <div className="text-xs text-gray-500">
                            x{item.quantity}
                          </div>
                        </div>
                        <div className="text-right min-w-[120px] flex flex-col items-end justify-center">
                          {item.oldPrice && item.oldPrice > item.price && (
                            <span className="line-through text-gray-400 text-sm mr-2">
                              {item.oldPrice.toLocaleString()}₫
                            </span>
                          )}
                          <span className="text-[#0066CC] font-bold text-lg">
                            {item.price.toLocaleString()}₫
                          </span>
                          
                          {/* Nút đánh giá cho từng sản phẩm khi có nhiều sản phẩm và đơn hàng đã giao */}
                          {order.items.length > 1 && canReviewProduct(order, item) && (
                            <button
                              className="mt-2 border border-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-bold hover:bg-gray-100 transition"
                              onClick={() => handleOpenReviewModal(order, item)}
                              title={`Đánh giá: ${item.name}`}
                            >
                              Đánh Giá
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  {/* Chú thích nhỏ */}
                  {order.status === "shipping" && (
                    <div className="px-6 py-2 text-xs text-gray-500 bg-[#fff8f6] border-b border-[#f2f2f2]">
                      Vui lòng chỉ nhấn "Đã nhận hàng" khi đơn hàng đã được giao
                      đến bạn và sản phẩm nhận được không có vấn đề nào.
                    </div>
                  )}
                  {/* Tổng tiền + nút thao tác dưới cùng */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-base">Thành tiền:</span>
                      <span className="text-[#0066CC] font-bold text-2xl">
                        {order.totalAmount.toLocaleString()}₫
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      {order.status === "shipping" && (
                        <>
                          <button
                            onClick={() => handleConfirmReceipt(order.id)}
                            className="bg-[#0066CC] text-white px-7 py-2 rounded font-bold text-base hover:bg-[#599BDE] transition"
                          >
                            Đã Nhận Hàng
                          </button>
                        </>
                      )}
                      {canReviewOrder(order) && (
                        <>
                          {canBuyAgain(order) && (
                            <button
                              className="bg-[#0066CC] text-white px-7 py-2 rounded font-bold text-base hover:bg-[#599BDE] transition"
                              onClick={() => handleBuyAgain(order)}
                            >
                              Mua Lại
                            </button>
                          )}
                          
                          {/* Chỉ hiển thị nút đánh giá tổng khi có 1 sản phẩm */}
                          {order.items.length === 1 && canReviewOrder(order) && (
                            <button
                              className="border border-gray-300 text-gray-700 px-7 py-2 rounded font-bold text-base hover:bg-gray-100 transition"
                              onClick={() => handleOpenReviewModal(order, order.items[0])}
                            >
                              Đánh Giá
                            </button>
                          )}
                          
                          {canReturnOrder(order) && (
                            <button
                              className="border border-gray-300 text-gray-700 px-7 py-2 rounded font-bold text-base hover:bg-gray-100 transition"
                              onClick={() => handleReturnOrder(order)}
                            >
                              Trả hàng
                            </button>
                          )}
                        </>
                      )}
                      {/* Nút cho đơn hàng đã giao nhưng không có sản phẩm nào để đánh giá nữa */}
                      {order.status === "delivered" && order.delivered && !canReviewOrder(order) && (
                        <div className="flex items-center gap-2">
                          {canBuyAgain(order) && (
                            <button
                              className="bg-[#0066CC] text-white px-7 py-2 rounded font-bold text-base hover:bg-[#599BDE] transition"
                              onClick={() => handleBuyAgain(order)}
                            >
                              Mua Lại
                            </button>
                          )}
                          
                          {canReturnOrder(order) && (
                            <button
                              className="border border-gray-300 text-gray-700 px-7 py-2 rounded font-bold text-base hover:bg-gray-100 transition"
                              onClick={() => handleReturnOrder(order)}
                            >
                              Trả hàng
                            </button>
                          )}
                        </div>
                      )}
                      {order.status === "returned" && (
                        <button className="border border-gray-300 text-gray-700 px-7 py-2 rounded font-bold text-base hover:bg-gray-100 transition">
                          Xem Chi Tiết
                        </button>
                      )}
                      {order.status === "confirming" && (
                        <button
                          className="border border-gray-300 text-gray-700 px-7 py-2 rounded font-bold text-base hover:bg-gray-100 transition"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Hủy Đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Return Form Modal */}
      {showReturnForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pt-16"
          onClick={handleCloseReturnForm}
          style={{ overflow: 'hidden' }}
        >
          <div 
            ref={modalRef}
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={(e) => {
              e.currentTarget.focus();
              e.currentTarget.scrollTop = e.currentTarget.scrollTop;
            }}
            onWheel={(e) => {
              e.stopPropagation();
            }}
            onMouseMove={(e) => {
              if (!e.currentTarget.matches(':focus-within')) {
                e.currentTarget.focus();
              }
            }}
            style={{
              scrollBehavior: 'smooth',
              overscrollBehavior: 'contain'
            }}
            tabIndex={-1}
            data-modal-content="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-black">Trả hàng/Hoàn tiền</h2>
              <button
                onClick={handleCloseReturnForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Product Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-black">Chọn sản phẩm cần trả hàng</h3>
                  {selectedReturnOrder?.items?.length > 1 && (
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedReturnProducts.length === selectedReturnOrder?.items?.length}
                        onChange={(e) => handleSelectAllProducts(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      Chọn tất cả
                    </label>
                  )}
                </div>
                
                <div className="space-y-3">
                  {selectedReturnOrder?.items?.map((item: any, index: number) => {
                    const productKey = `${item.productId}_${index}`;
                    const isSelected = selectedReturnProducts.includes(productKey);
                    
                    return (
                      <div 
                        key={productKey}
                        className={`bg-gray-50 p-4 rounded-lg border-2 transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleProductSelection(productKey, e.target.checked)}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <img
                            src={item.image || "/placeholder.jpg"}
                            alt="product"
                            className="w-20 h-20 object-contain border rounded bg-white"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-base text-gray-900">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Phân loại hàng: {getVnColorName(item.colorName)}
                            </div>
                            <div className="text-sm text-gray-500">
                              x{item.quantity}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[#0066CC] font-bold text-lg">
                              {item.price?.toLocaleString()}₫
                            </span>
                            <div className="text-sm text-gray-500">
                              Tổng: {(item.price * item.quantity)?.toLocaleString()}₫
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {selectedReturnProducts.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 font-medium">
                        Đã chọn {selectedReturnProducts.length} sản phẩm
                      </span>
                      <span className="text-blue-700 font-bold text-lg">
                        Tổng tiền: {calculateRefundAmount().toLocaleString()}₫
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Return Reason */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-black">Lý do trả hàng</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      *Lý do:
                    </label>
                    <div className="relative">
                      <select
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-3 bg-white focus:outline-none focus:border-[#0066CC] appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Chọn Lý Do</option>
                        <option value="Thiếu hàng">Thiếu hàng</option>
                        <option value="Người bán gửi sai hàng">Người bán gửi sai hàng</option>
                        <option value="Hàng bể vỡ">Hàng bể vỡ</option>
                        <option value="Hàng lỗi, không hoạt động">Hàng lỗi, không hoạt động</option>
                        <option value="Hàng hết hạn sử dụng">Hàng hết hạn sử dụng</option>
                        <option value="Khác với mô tả">Khác với mô tả</option>
                        <option value="Hàng đã qua sử dụng">Hàng đã qua sử dụng</option>
                        <option value="Tôi không còn muốn sử dụng sản phẩm">Tôi không còn muốn sử dụng sản phẩm</option>
                        <option value="Sản phẩm bị lỗi/hỏng">Sản phẩm bị lỗi/hỏng</option>
                        <option value="Sản phẩm không đúng mô tả">Sản phẩm không đúng mô tả</option>
                        <option value="Tôi muốn đổi sang sản phẩm khác">Tôi muốn đổi sang sản phẩm khác</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả:
                </label>
                <textarea
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  placeholder="Chi tiết vấn đề bạn gặp phải"
                  className="w-full border border-gray-300 rounded-md p-3 h-32 resize-none focus:outline-none focus:border-[#0066CC]"
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {returnDescription.length}/2000
                </div>
              </div>

              {/* Refund Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-black">Thông tin hoàn tiền</h3>
                <div className="space-y-4">
                  {needRefund(selectedReturnOrder?.paymentMethod, selectedReturnOrder?.paymentStatus) ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Số tiền có thể hoàn lại:</span>
                        <span className="font-bold text-blue-500 text-xl">
                          {calculateRefundAmount().toLocaleString()}₫
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Hoàn tiền vào:</span>
                        <span className="text-gray-800">Số dư Ví PolyPay</span>
                      </div>
                      
                    </>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Đơn hàng thanh toán khi nhận hàng (COD)</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Vì bạn chưa thanh toán cho đơn hàng này, nên không cần thực hiện hoàn tiền. 
                        Chúng tôi chỉ cần xác nhận việc trả hàng.
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      *Email liên hệ:
                    </label>
                    <input
                      type="email"
                      value={returnEmail}
                      onChange={(e) => setReturnEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:border-[#0066CC]"
                      placeholder="Email để chúng tôi liên hệ xử lý"
                    />
                  </div>
                </div>
              </div>

              {/* Refund Amount Summary */}
              {needRefund(selectedReturnOrder?.paymentMethod, selectedReturnOrder?.paymentStatus) && selectedReturnProducts.length > 0 && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-lg font-bold text-black">
                    <span>Số tiền hoàn nhận được</span>
                    <span className="text-blue-500">{calculateRefundAmount().toLocaleString()}₫</span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseReturnForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitReturn}
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-medium"
                >
                  Hoàn thành
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedProduct && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={handleCloseReviewModal}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          productImage={selectedProduct.image}
          onReviewSubmitted={handleReviewSubmitted}
          colorName={selectedProduct.colorName}
          dung_luong={selectedProduct.dung_luong}
        />
      )}
    </>
  );
} 
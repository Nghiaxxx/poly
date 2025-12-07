const Voucher = require('../models/voucherModel');
const UserVoucher = require('../models/userVoucherModel');
const GiftVoucher = require('../models/giftVoucherModel'); // Added GiftVoucher model
const Order = require('../models/orderModel'); // Added Order model
const mongoose = require('mongoose'); // Added mongoose

// @desc    Lấy tất cả voucher (cho admin, có phân trang)
// @route   GET /api/vouchers
// @access  Private/Admin
exports.getAllVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find({}).sort({ createdAt: -1 });
        res.json({ success: true, count: vouchers.length, data: vouchers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};

// @desc    Lấy một voucher bằng ID
// @route   GET /api/vouchers/:id
// @access  Private/Admin
exports.getVoucherById = async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
        }
        res.json({ success: true, data: voucher });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};

// @desc    Tạo voucher mới
// @route   POST /api/vouchers
// @access  Private/Admin
exports.createVoucher = async (req, res) => {
    try {
        const { ma_voucher, mo_ta, phan_tram_giam_gia, giam_toi_da, don_hang_toi_thieu, so_luong, ngay_bat_dau, ngay_ket_thuc, trang_thai, popup, danh_muc, hien_thi_cong_khai } = req.body;

        // Validation
        if (!ma_voucher || !ma_voucher.trim()) {
            return res.status(400).json({ success: false, message: 'Mã voucher là bắt buộc' });
        }
        if (!mo_ta || !mo_ta.trim()) {
            return res.status(400).json({ success: false, message: 'Mô tả là bắt buộc' });
        }
        if (!phan_tram_giam_gia || phan_tram_giam_gia <= 0 || phan_tram_giam_gia > 100) {
            return res.status(400).json({ success: false, message: 'Phần trăm giảm giá phải từ 1-100%' });
        }
        if (!giam_toi_da || giam_toi_da <= 0) {
            return res.status(400).json({ success: false, message: 'Mức giảm tối đa phải lớn hơn 0' });
        }
        if (!so_luong || so_luong <= 0) {
            return res.status(400).json({ success: false, message: 'Số lượng voucher phải lớn hơn 0' });
        }
        if (!ngay_bat_dau) {
            return res.status(400).json({ success: false, message: 'Ngày bắt đầu là bắt buộc' });
        }
        if (!ngay_ket_thuc) {
            return res.status(400).json({ success: false, message: 'Ngày kết thúc là bắt buộc' });
        }
        if (new Date(ngay_bat_dau) >= new Date(ngay_ket_thuc)) {
            return res.status(400).json({ success: false, message: 'Ngày bắt đầu phải trước ngày kết thúc' });
        }

        // Kiểm tra nếu voucher này được đánh dấu popup, thì tắt popup của các voucher khác
        if (popup) {
            await Voucher.updateMany(
                { popup: true },
                { popup: false }
            );
        }

        const upper_ma_voucher = ma_voucher.toUpperCase();
        const voucherExists = await Voucher.findOne({ ma_voucher: upper_ma_voucher });

        if (voucherExists) {
            return res.status(400).json({ 
                success: false, 
                message: `Mã voucher "${upper_ma_voucher}" đã tồn tại. Vui lòng chọn mã khác.` 
            });
        }

        const voucher = new Voucher({
            ma_voucher: upper_ma_voucher,
            loai: 'public', // Voucher công khai
            mo_ta: mo_ta.trim(),
            phan_tram_giam_gia: Number(phan_tram_giam_gia),
            giam_toi_da: Number(giam_toi_da),
            don_hang_toi_thieu: Number(don_hang_toi_thieu) || 0,
            so_luong: Number(so_luong),
            ngay_bat_dau: new Date(ngay_bat_dau),
            ngay_ket_thuc: new Date(ngay_ket_thuc),
            trang_thai: trang_thai || 'active',
            popup: popup || false,
            danh_muc: danh_muc || [],
            hien_thi_cong_khai: hien_thi_cong_khai || false,
        });

        const createdVoucher = await voucher.save();
        res.status(201).json({ success: true, data: createdVoucher });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: `Dữ liệu không hợp lệ: ${messages.join(', ')}`,
                errors: messages,
            });
        } else if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mã voucher này đã tồn tại. Vui lòng chọn mã khác.' 
            });
        } else {
             console.error('Lỗi khi tạo voucher:', error);
             res.status(500).json({ success: false, message: 'Lỗi server khi tạo voucher.' });
        }
    }
};

// @desc    Cập nhật voucher
// @route   PUT /api/vouchers/:id
// @access  Private/Admin
exports.updateVoucher = async (req, res) => {
    try {
        // Nếu cập nhật mã voucher, cũng nên chuyển thành chữ hoa
        if(req.body.ma_voucher) {
            req.body.ma_voucher = req.body.ma_voucher.toUpperCase();
        }

        // Đảm bảo field popup được xử lý đúng
        if (req.body.popup !== undefined) {
            req.body.popup = Boolean(req.body.popup);
            
            // Nếu voucher này được đánh dấu popup, thì tắt popup của các voucher khác
            if (req.body.popup) {
                await Voucher.updateMany(
                    { _id: { $ne: req.params.id }, popup: true },
                    { popup: false }
                );
            }
        }

        const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
        }

        res.json({ success: true, data: voucher });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: `Dữ liệu không hợp lệ: ${messages.join(', ')}`,
                errors: messages,
            });
        } else if (error.code === 11000) { // Lỗi trùng key (E11000)
            return res.status(400).json({ success: false, message: 'Mã voucher này đã tồn tại.' });
        }
        else {
            console.error(`Lỗi khi cập nhật voucher ${req.params.id}:`, error);
            res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật voucher.', error: error.message });
        }
    }
};

// @desc    Xóa voucher
// @route   DELETE /api/vouchers/:id
// @access  Private/Admin
exports.deleteVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findByIdAndDelete(req.params.id);

        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
        }

        res.json({ success: true, message: 'Voucher đã được xóa' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};

// Tạo user voucher mới khi user quay trúng
exports.createUserVoucher = async (req, res) => {
  try {
    const { user_email, voucher_id, ma_voucher, expired_at } = req.body;
    // Kiểm tra đã phát voucher này cho user chưa
    const existed = await UserVoucher.findOne({ user_email, voucher_id });
    if (existed) {
      return res.status(400).json({ success: false, message: 'User already received this voucher' });
    }
    const userVoucher = new UserVoucher({
      user_email,
      voucher_id,
      ma_voucher,
      expired_at
    });
    await userVoucher.save();
    res.status(201).json({ success: true, data: userVoucher });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy danh sách voucher của user
exports.getUserVouchers = async (req, res) => {
  try {
    const { user_email } = req.params;
    const vouchers = await UserVoucher.find({ user_email }).populate('voucher_id');
    res.json({ success: true, data: vouchers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Đánh dấu voucher đã sử dụng
exports.useUserVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const userVoucher = await UserVoucher.findByIdAndUpdate(id, { used: true }, { new: true });
    if (!userVoucher) return res.status(404).json({ success: false, message: 'User voucher not found' });
    res.json({ success: true, data: userVoucher });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Kiểm tra mã voucher có tồn tại không
// @route   GET /api/vouchers/check/:code
// @access  Public
exports.checkVoucherCode = async (req, res) => {
    try {
        const { code } = req.params;
        const voucher = await Voucher.findOne({ ma_voucher: code.toUpperCase() });
        
        if (voucher) {
            return res.json({ 
                success: false, 
                exists: true, 
                message: 'Mã voucher này đã tồn tại' 
            });
        } else {
            return res.json({ 
                success: true, 
                exists: false, 
                message: 'Mã voucher có thể sử dụng' 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi kiểm tra mã voucher', 
            error: error.message 
        });
    }
};

// @desc    Áp dụng voucher (cho người dùng ở trang thanh toán)
// @route   GET /api/vouchers/apply/:code
// @access  Public
exports.applyVoucher = async (req, res) => {
    try {
        const { code } = req.params;
        const { user_email } = req.query; // Lấy user_email từ query parameter
        
        if (!user_email) {
            return res.status(400).json({ success: false, message: 'Email người dùng là bắt buộc để kiểm tra voucher.' });
        }

        // Tìm voucher từ collection Voucher thống nhất
        const voucher = await Voucher.findOne({ ma_voucher: code.toUpperCase() });
        
        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Mã giảm giá không hợp lệ.' });
        }

        // Kiểm tra điều kiện sử dụng theo loại voucher
        if (voucher.loai === 'gift') {
            // GIFT VOUCHER - Kiểm tra user đã sử dụng chưa
            const existingUsage = await UserVoucher.findOne({ 
                user_email, 
                ma_voucher: code.toUpperCase(),
                used: true 
            });

            if (existingUsage) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Bạn đã sử dụng voucher này rồi!' 
                });
            }

            // Kiểm tra trạng thái Gift Voucher
            if (voucher.da_su_dung > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Voucher này đã được sử dụng.' 
                });
            }
            if (voucher.da_vo_hieu_hoa) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Voucher này đã bị vô hiệu hóa.' 
                });
            }
            if (new Date() > voucher.ngay_ket_thuc) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Voucher này đã hết hạn.' 
                });
            }
            
        } else if (voucher.loai === 'public') {
            // PUBLIC VOUCHER - Kiểm tra thời gian và số lượng
            const now = new Date();
            if (voucher.trang_thai !== 'active') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Mã giảm giá đã hết hiệu lực.' 
                });
            }
            if (now < voucher.ngay_bat_dau) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Mã giảm giá chưa đến ngày sử dụng.' 
                });
            }
            if (now > voucher.ngay_ket_thuc) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Mã giảm giá đã hết hạn.' 
                });
            }
            // Kiểm tra số lượng tổng - không kiểm tra user đã sử dụng
            if (voucher.so_luong <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Mã giảm giá đã hết lượt sử dụng.' 
                });
            }
            
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Loại voucher không được hỗ trợ.' 
            });
        }

        // Trả về voucher với đầy đủ thông tin để frontend xử lý
        res.json({ 
            success: true, 
            data: voucher 
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi áp dụng voucher', 
            error: error.message 
        });
    }
};

// @desc    Sử dụng voucher (cập nhật số lượng đã sử dụng)
// @route   POST /api/vouchers/use/:code
// @access  Public
exports.useVoucher = async (req, res) => {
    try {
        const { code } = req.params;
        const { user_email, order_id } = req.body;

        if (!user_email) {
            return res.status(400).json({ success: false, message: 'Email người dùng là bắt buộc.' });
        }

        // Tìm voucher công khai trước
        let voucher = await Voucher.findOne({ ma_voucher: code.toUpperCase() });
        let isGiftVoucher = false;
        let giftVoucher = null;

        // Nếu không phải voucher công khai, kiểm tra Gift Voucher
        if (!voucher) {
            giftVoucher = await Voucher.findOne({ ma_voucher: code.toUpperCase(), loai: 'gift' });
            if (giftVoucher) {
                isGiftVoucher = true;
            } else {
                return res.status(404).json({ success: false, message: 'Mã giảm giá không hợp lệ.' });
            }
        }

        // Kiểm tra điều kiện sử dụng
        if (isGiftVoucher) {
            // CHỈ CHẶN GIFT VOUCHER - Kiểm tra user đã sử dụng chưa
            const existingUsage = await UserVoucher.findOne({ 
                user_email, 
                ma_voucher: code.toUpperCase(),
                used: true 
            });

            if (existingUsage) {
                return res.status(400).json({ success: false, message: 'Bạn đã sử dụng voucher này rồi.' });
            }

            // Kiểm tra Gift Voucher
            if (giftVoucher.da_su_dung) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Voucher này đã được sử dụng.' 
                });
            }
            if (giftVoucher.da_vo_hieu_hoa) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Voucher này đã bị vô hiệu hóa.' 
                });
            }
            if (new Date() > giftVoucher.het_han) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Voucher này đã hết hạn.' 
                });
            }
        } else {
            // VOUCHER CÔNG KHAI - KHÔNG CHẶN USER, chỉ kiểm tra số lượng tổng
            const now = new Date();
            if (voucher.trang_thai !== 'active') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Mã giảm giá đã hết hiệu lực.' 
                });
            }
            if (now < voucher.ngay_bat_dau) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Mã giảm giá chưa đến ngày sử dụng.' 
                });
            }
            if (now > voucher.ngay_ket_thuc) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Mã giảm giá đã hết hạn.' 
                });
            }
            // Kiểm tra số lượng tổng - không kiểm tra user đã sử dụng
            if (voucher.so_luong <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Mã giảm giá đã hết lượt sử dụng.' 
                });
            }
        }

        let updatedVoucher = null;

        if (isGiftVoucher) {
            // Cập nhật Gift Voucher ngay lập tức
            updatedVoucher = await Voucher.findByIdAndUpdate(
                giftVoucher._id,
                { da_su_dung: true },
                { new: true }
            );
        } else {
            // Cập nhật Public Voucher - tăng số lượng đã sử dụng và giảm số lượng còn lại
            // Điều này để theo dõi tổng số user đã sử dụng voucher
            updatedVoucher = await Voucher.findByIdAndUpdate(
                voucher._id,
                { $inc: { da_su_dung: 1, so_luong: -1 } },
                { new: true }
            );
        }

        // Tạo record sử dụng voucher ngay lập tức
        const userVoucher = new UserVoucher({
            user_email,
            voucher_id: isGiftVoucher ? giftVoucher._id : voucher._id,
            ma_voucher: code.toUpperCase(),
            order_id: order_id || null,
            used: true,
            used_at: new Date(),
            expired_at: isGiftVoucher ? giftVoucher.het_han : voucher.ngay_ket_thuc,
            loai: isGiftVoucher ? 'gift' : 'public'
        });

        await userVoucher.save();

        // Kiểm tra nếu Public Voucher hết số lượng, tự động tắt popup
        if (!isGiftVoucher && updatedVoucher.so_luong <= 0) {
            await Voucher.findByIdAndUpdate(voucher._id, { popup: false });
        }

        res.json({ 
            success: true, 
            message: 'Voucher đã được sử dụng thành công.',
            data: updatedVoucher 
        });

    } catch (error) {
        console.error('Lỗi khi sử dụng voucher:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi sử dụng voucher', 
            error: error.message 
        });
    }
};

// @desc    Lấy voucher popup (cho frontend)
// @route   GET /api/vouchers/popup
// @access  Public
exports.getPopupVoucher = async (req, res) => {
    try {
        const now = new Date();
        
        // Sửa query để kiểm tra số lượng user đã sử dụng
        // Với voucher công khai: mỗi user chỉ được sử dụng 1 lần
        const popupVoucher = await Voucher.findOne({
            popup: true,
            trang_thai: 'active',
            ngay_bat_dau: { $lte: now },
            ngay_ket_thuc: { $gte: now },
            $expr: { $lt: ['$da_su_dung', '$so_luong'] } // Vẫn cần kiểm tra tổng số user đã sử dụng
        });

        if (!popupVoucher) {
            return res.json({ success: true, data: null });
        }

        res.json({ success: true, data: popupVoucher });
    } catch (error) {
        console.error('Lỗi khi lấy voucher popup:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi lấy voucher popup', 
            error: error.message 
        });
    }
};

// @desc    Tự động quét voucher đã sử dụng (cho cron job và API)
// @route   POST /api/vouchers/auto-scan
// @access  Public
exports.autoScanUsedVouchers = async (req, res) => {
    try {
        console.log(`🔄 [${new Date().toLocaleString('vi-VN')}] Bắt đầu tự động quét voucher đã sử dụng...`);
        
        // Tìm tất cả orders có sử dụng voucher
        const ordersWithVouchers = await Order.find({ 
            voucherCode: { $exists: true, $ne: null, $ne: '' } 
        });
        
        console.log(`📦 Tìm thấy ${ordersWithVouchers.length} đơn hàng có sử dụng voucher`);
        
        let fixedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        for (const order of ordersWithVouchers) {
            try {
                // Tìm Gift Voucher
                const giftVoucher = await Voucher.findOne({ 
                    ma_voucher: order.voucherCode.toUpperCase(),
                    loai: 'gift'
                });
                
                if (!giftVoucher) {
                    // Không phải Gift Voucher, bỏ qua
                    skippedCount++;
                    continue;
                }
                
                // Kiểm tra xem đã có UserVoucher record chưa
                const existingUserVoucher = await UserVoucher.findOne({
                    ma_voucher: order.voucherCode.toUpperCase(),
                    order_id: order._id
                });
                
                if (existingUserVoucher) {
                    // Đã có record, chỉ cần cập nhật GiftVoucher nếu cần
                    if (!giftVoucher.da_su_dung) {
                        await Voucher.findByIdAndUpdate(giftVoucher._id, { da_su_dung: true });
                        fixedCount++;
                        console.log(`   ✅ Cập nhật voucher ${giftVoucher.ma_voucher} cho order ${order._id}`);
                    }
                } else {
                    // Chưa có record, tạo mới
                    const newUserVoucher = new UserVoucher({
                        nguoi_dung: order.customerInfo._id || new mongoose.Types.ObjectId(),
                        ma_voucher: giftVoucher.ma_voucher,
                        loai: 'gift',
                        da_su_dung: true,
                        het_han: giftVoucher.ngay_ket_thuc, // Use ngay_ket_thuc from Voucher
                        ngay_tao: new Date()
                    });
                    
                    await newUserVoucher.save();
                    
                    // Cập nhật GiftVoucher
                    if (!giftVoucher.da_su_dung) {
                        await Voucher.findByIdAndUpdate(giftVoucher._id, { da_su_dung: true });
                        fixedCount++;
                        console.log(`   ✅ Tạo mới và cập nhật voucher ${giftVoucher.ma_voucher} cho order ${order._id}`);
                    }
                }
                
            } catch (error) {
                console.error(`   ❌ Lỗi xử lý order ${order._id}:`, error.message);
                errorCount++;
            }
        }
        
        console.log(`✅ [${new Date().toLocaleString('vi-VN')}] Hoàn thành quét voucher!`);
        console.log(`   📊 Đã sửa: ${fixedCount}, Bỏ qua: ${skippedCount}, Lỗi: ${errorCount}`);
        
        // Trả về kết quả cho API
        res.json({
            success: true,
            message: 'Đã quét và cập nhật voucher thành công',
            data: {
                totalOrders: ordersWithVouchers.length,
                fixedVouchers: fixedCount,
                skippedVouchers: skippedCount,
                errorCount: errorCount
            }
        });
        
    } catch (error) {
        console.error(`❌ [${new Date().toLocaleString('vi-VN')}] Error auto scanning vouchers:`, error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi quét voucher tự động',
            error: error.message
        });
    }
}; 

// @desc    Lấy voucher công khai theo danh mục
// @route   GET /api/vouchers/public/:categoryId
// @access  Public
exports.getPublicVouchersByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const currentDate = new Date();
        
        const vouchers = await Voucher.find({
            trang_thai: 'active',
            hien_thi_cong_khai: true,
            danh_muc: categoryId,
            ngay_bat_dau: { $lte: currentDate },
            ngay_ket_thuc: { $gte: currentDate }
        }).sort({ createdAt: -1 });
        
        // Lọc voucher còn lại
        const availableVouchers = vouchers.filter(voucher => 
            voucher.so_luong > voucher.da_su_dung
        );
        
        res.json({ 
            success: true, 
            count: availableVouchers.length, 
            data: availableVouchers 
        });
    } catch (error) {
        console.error('Lỗi khi lấy voucher theo danh mục:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi lấy voucher', 
            error: error.message
        });
    }
}; 
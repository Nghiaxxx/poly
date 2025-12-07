const Voucher = require('../models/voucherModel');
const { sendVoucherEmail } = require('../services/emailService');
const validator = require('validator');

// Hàm tạo mã voucher random
function generateVoucherCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'POLY-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Tạo gift voucher và gửi email
exports.createGiftVoucher = async (req, res) => {
  try {
    const { name, phone, email, qua_duoc_chon, phan_tram, het_han } = req.body;

    // Kiểm tra email hợp lệ
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ. Vui lòng nhập đúng định dạng email.'
      });
    }

    // Kiểm tra email đã tồn tại chưa (trong collection Voucher với loai: 'gift')
    const existingVoucher = await Voucher.findOne({ email, loai: 'gift' });
    if (existingVoucher) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được sử dụng để nhận voucher'
      });
    }

    // Tạo mã voucher mới
    let ma_voucher;
    let isUnique = false;
    while (!isUnique) {
      ma_voucher = generateVoucherCode();
      const existingCode = await Voucher.findOne({ ma_voucher });
      if (!existingCode) {
        isUnique = true;
      }
    }

    // Tạo gift voucher mới trong collection Voucher
    const giftVoucher = new Voucher({
      ma_voucher,
      loai: 'gift',
      mo_ta: `Gift voucher cho ${name}`,
      phan_tram_giam_gia: phan_tram || 0,
      giam_toi_da: 0, // Gift voucher không có giới hạn giảm tối đa
      don_hang_toi_thieu: 0, // Gift voucher không có đơn hàng tối thiểu
      so_luong: 1, // Gift voucher chỉ dùng 1 lần
      da_su_dung: 0,
      ngay_bat_dau: new Date(),
      ngay_ket_thuc: het_han,
      trang_thai: 'active',
      popup: false,
      danh_muc: [],
      hien_thi_cong_khai: false,
      
      // Các field đặc biệt của Gift Voucher
      name,
      phone,
      email,
      qua_duoc_chon: qua_duoc_chon || 0,
      da_vo_hieu_hoa: false,
      email_da_gui: false
    });

    await giftVoucher.save();

    // Gửi email voucher
    const emailResult = await sendVoucherEmail(email, name, ma_voucher);
    
    if (emailResult.success) {
      // Cập nhật trạng thái đã gửi email
      await Voucher.findByIdAndUpdate(giftVoucher._id, {
        email_da_gui: true,
        email_gui_luc: new Date()
      });
    } else {
      // Log the detailed error from Nodemailer
      console.error('Nodemailer failed to send email. Reason:', emailResult.error);
    }

    res.status(201).json({
      success: true,
      data: {
        ma_voucher,
        phan_tram,
        het_han,
        email_da_gui: emailResult.success,
        message: emailResult.success 
          ? 'Voucher đã được tạo và gửi email thành công!' 
          : 'Voucher đã được tạo nhưng gửi email thất bại. Vui lòng liên hệ hỗ trợ.'
      }
    });

  } catch (error) {
    console.error('Error creating gift voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tạo voucher'
    });
  }
};

// Lấy thông tin voucher theo email
exports.getVoucherByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const voucher = await Voucher.findOne({ email, loai: 'gift' });
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher cho email này'
      });
    }

    res.json({
      success: true,
      data: voucher
    });

  } catch (error) {
    console.error('Error getting voucher by email:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy thông tin voucher'
    });
  }
};

// Lấy thông tin voucher theo mã
exports.getVoucherByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const voucher = await Voucher.findOne({ ma_voucher: code, loai: 'gift' });
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Mã voucher không hợp lệ'
      });
    }

    // Kiểm tra xem voucher có thể sử dụng không
    const now = new Date();
    const isExpired = now > voucher.ngay_ket_thuc;
    const isDisabled = voucher.da_vo_hieu_hoa;
    const isUsed = voucher.da_su_dung > 0;

    // Trả về thông tin chi tiết về trạng thái voucher
    res.json({
      success: true,
      data: {
        ...voucher.toObject(),
        isExpired,
        isDisabled,
        isUsed,
        canUse: !isExpired && !isDisabled && !isUsed
      }
    });

  } catch (error) {
    console.error('Error getting voucher by code:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy thông tin voucher'
    });
  }
};

// Gửi lại email voucher
exports.resendVoucherEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const voucher = await Voucher.findOne({ email, loai: 'gift' });
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher cho email này'
      });
    }

    // Gửi lại email
    const emailResult = await sendVoucherEmail(voucher.email, voucher.name, voucher.ma_voucher);
    
    if (emailResult.success) {
      // Cập nhật trạng thái đã gửi email
      await Voucher.findByIdAndUpdate(voucher._id, {
        email_da_gui: true,
        email_gui_luc: new Date()
      });
    }

    res.json({
      success: emailResult.success,
      message: emailResult.success 
        ? 'Email đã được gửi lại thành công!' 
        : 'Gửi email thất bại. Vui lòng thử lại sau.'
    });

  } catch (error) {
    console.error('Error resending voucher email:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi gửi lại email'
    });
  }
};

// Lấy tất cả gift vouchers (cho admin)
exports.getAllGiftVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({ loai: 'gift' }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: vouchers
    });
  } catch (error) {
    console.error('Error getting all gift vouchers:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách voucher'
    });
  }
};

// Vô hiệu hóa voucher
exports.disableVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await Voucher.findByIdAndUpdate(
      id, 
      { da_vo_hieu_hoa: true }, 
      { new: true }
    );
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher không tồn tại' });
    }
    res.json({ success: true, message: 'Voucher đã được vô hiệu hóa', data: voucher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Có lỗi khi vô hiệu hóa voucher' });
  }
}; 
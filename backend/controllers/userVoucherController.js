const UserVoucher = require('../models/userVoucherModel');
const Voucher = require('../models/voucherModel');
const mongoose = require('mongoose');

exports.getUserVouchers = async (req, res) => {
  try {
    const { nguoi_dung } = req.query;
    if (!nguoi_dung) return res.json({ success: false, message: 'Thiếu nguoi_dung' });
    const userVouchers = await UserVoucher.find({ nguoi_dung });

    // Lấy thông tin chi tiết cho từng voucher từ collection Voucher thống nhất
    const result = await Promise.all(userVouchers.map(async (uv) => {
      const detail = await Voucher.findOne({ ma_voucher: uv.ma_voucher });
      return {
        ...uv.toObject(),
        detail
      };
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

exports.addUserVoucher = async (req, res) => {
  try {
    const { nguoi_dung, code } = req.body;
    if (!nguoi_dung || !code) return res.json({ success: false, message: 'Thiếu thông tin' });
    const nguoiDungObjId = new mongoose.Types.ObjectId(nguoi_dung);
    const existed = await UserVoucher.findOne({ nguoi_dung: nguoiDungObjId, ma_voucher: code.toUpperCase() });
    if (existed) return res.json({ success: false, message: 'Bạn đã lưu mã này rồi!' });
    
    // Tìm voucher từ collection Voucher thống nhất
    const voucher = await Voucher.findOne({ 
      ma_voucher: code.toUpperCase(),
      trang_thai: 'active',
      $or: [
        // Gift voucher: chưa sử dụng và chưa vô hiệu hóa
        { 
          loai: 'gift', 
          da_su_dung: 0, 
          da_vo_hieu_hoa: false 
        },
        // Public voucher: còn số lượng và trong thời gian hiệu lực
        { 
          loai: 'public', 
          $expr: { $gt: ["$so_luong", "$da_su_dung"] },
          ngay_bat_dau: { $lte: new Date() },
          ngay_ket_thuc: { $gte: new Date() }
        }
      ]
    });
    
    if (!voucher) {
      return res.json({ success: false, message: 'Mã voucher không hợp lệ hoặc đã hết lượt sử dụng/vô hiệu hóa.' });
    }
    
    // Tạo UserVoucher record
    await UserVoucher.create({ 
      nguoi_dung: nguoiDungObjId, 
      ma_voucher: code.toUpperCase(), 
      loai: voucher.loai, 
      het_han: voucher.ngay_ket_thuc 
    });
    
    return res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}; 
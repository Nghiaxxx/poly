const User = require('../models/userModel');

// Lấy tất cả địa chỉ của user
exports.getAddressesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    const addresses = (user.addresses || []).sort((a, b) => {
      if (a.isDefault === b.isDefault) {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return a.isDefault ? -1 : 1;
    });
    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error('Error getting addresses:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách địa chỉ' });
  }
};

// Tạo địa chỉ mới
exports.createAddress = async (req, res) => {
  try {
    const { userId, name, phone, address, province, district, isDefault } = req.body;
    
    // Validation
    if (!userId || !name || !phone || !address || !province || !district) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng điền đầy đủ thông tin' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // Nếu set mặc định, bỏ mặc định các địa chỉ khác
    if (isDefault) {
      user.addresses = (user.addresses || []).map(a => ({ ...a.toObject?.() || a, isDefault: false }));
    }

    const now = new Date();
    const mongoose = require('mongoose');
    const newAddress = {
      _id: new mongoose.Types.ObjectId().toString(),
      name,
      phone,
      address,
      province,
      district,
      isDefault: !!isDefault,
      createdAt: now,
      updatedAt: now
    };

    user.addresses = user.addresses || [];
    user.addresses.push(newAddress);

    await user.save();

    res.status(201).json({ success: true, data: newAddress });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo địa chỉ' });
  }
};

// Cập nhật địa chỉ
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, province, district, isDefault } = req.body;

    // Tìm user chứa địa chỉ này
    const user = await User.findOne({ 'addresses._id': id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    }

    // Nếu set mặc định, bỏ mặc định các địa chỉ khác
    if (isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    // Cập nhật địa chỉ cụ thể
    const addr = user.addresses.find(a => a._id === id);
    if (!addr) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    }

    if (name !== undefined) addr.name = name;
    if (phone !== undefined) addr.phone = phone;
    if (address !== undefined) addr.address = address;
    if (province !== undefined) addr.province = province;
    if (district !== undefined) addr.district = district;
    if (isDefault !== undefined) addr.isDefault = isDefault;
    addr.updatedAt = new Date();

    await user.save();

    res.json({ success: true, data: addr });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật địa chỉ' });
  }
};

// Xóa địa chỉ
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ 'addresses._id': id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    }

    const idx = user.addresses.findIndex(a => a._id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    }

    const wasDefault = !!user.addresses[idx].isDefault;
    user.addresses.splice(idx, 1);

    // Nếu xóa địa chỉ mặc định, set địa chỉ đầu tiên còn lại làm mặc định
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
      user.addresses[0].updatedAt = new Date();
    }

    await user.save();

    res.json({ success: true, message: 'Xóa địa chỉ thành công' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa địa chỉ' });
  }
};

// Set địa chỉ làm mặc định
exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ 'addresses._id': id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ' });
    }

    user.addresses.forEach(a => { a.isDefault = a._id === id; a.updatedAt = new Date(); });

    await user.save();

    const updated = user.addresses.find(a => a._id === id);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi set địa chỉ mặc định' });
  }
}; 
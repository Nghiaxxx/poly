const mongoose = require('mongoose');

// Schema cho địa chỉ con
const addressSubSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    province: { type: String, required: true },
    district: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
    Sdt: { type: String },
    TenKH: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    gioi_tinh: { type: String },
    sinh_nhat: { type: String },
    dia_chi: { type: String }, // Giữ lại để backward compatibility
    tinh_thanh: { type: String }, // Giữ lại để backward compatibility
    quan_huyen: { type: String }, // Giữ lại để backward compatibility
    username: { type: String, unique: true },
    avatar: { type: String },
    active: { type: Boolean, default: true }, // Trạng thái hoạt động
    lastLogin: { type: Date }, // Thời gian đăng nhập cuối
    addresses: [addressSubSchema] // Mảng địa chỉ mới
},{versionKey: false});
const userModel = mongoose.model('users', userSchema, 'users');

module.exports = userModel;
const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    ma_voucher: {
        type: String,
        required: [true, 'Mã voucher là bắt buộc'],
        unique: true,
        trim: true,
        uppercase: true
    },
    // Thêm field loai để phân biệt loại voucher
    loai: {
        type: String,
        enum: ['public', 'gift'],
        default: 'public',
        required: true
    },
    mo_ta: {
        type: String,
        required: function() {
            // Mô tả chỉ bắt buộc với voucher public
            return this.loai === 'public';
        }
    },
    phan_tram_giam_gia: {
        type: Number,
        required: function() {
            // Phần trăm giảm giá bắt buộc với voucher public
            return this.loai === 'public';
        },
        min: 0,
        max: 100
    },
    giam_toi_da: {
        type: Number,
        required: function() {
            // Mức giảm tối đa bắt buộc với voucher public
            return this.loai === 'public';
        },
        default: 0
    },
    don_hang_toi_thieu: {
        type: Number,
        required: function() {
            // Đơn hàng tối thiểu bắt buộc với voucher public
            return this.loai === 'public';
        },
        default: 0
    },
    so_luong: {
        type: Number,
        required: function() {
            // Số lượng bắt buộc với voucher public
            return this.loai === 'public';
        },
        default: function() {
            // Gift voucher mặc định chỉ có 1
            return this.loai === 'gift' ? 1 : undefined;
        }
    },
    da_su_dung: {
        type: Number,
        default: 0
    },
    ngay_bat_dau: {
        type: Date,
        required: function() {
            // Ngày bắt đầu bắt buộc với voucher public
            return this.loai === 'public';
        },
        default: function() {
            // Gift voucher mặc định bắt đầu từ ngày tạo
            return this.loai === 'gift' ? new Date() : undefined;
        }
    },
    ngay_ket_thuc: {
        type: Date,
        required: [true, 'Ngày kết thúc là bắt buộc']
    },
    trang_thai: {
        type: String,
        enum: ['active', 'inactive', 'expired'],
        default: 'active'
    },
    popup: {
        type: Boolean,
        default: false
    },
    danh_muc: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    hien_thi_cong_khai: {
        type: Boolean,
        default: function() {
            // Gift voucher không hiển thị công khai
            return this.loai === 'public';
        }
    },
    
    // Các field đặc biệt cho Gift Voucher
    name: {
        type: String,
        required: function() {
            // Tên người nhận bắt buộc với gift voucher
            return this.loai === 'gift';
        }
    },
    phone: {
        type: String,
        required: function() {
            // Số điện thoại bắt buộc với gift voucher
            return this.loai === 'gift';
        }
    },
    email: {
        type: String,
        required: function() {
            // Email bắt buộc với gift voucher
            return this.loai === 'gift';
        }
    },
    da_vo_hieu_hoa: {
        type: Boolean,
        default: false
    },
    email_da_gui: {
        type: Boolean,
        default: false
    },
    email_gui_luc: {
        type: Date
    },
    qua_duoc_chon: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual property to check if voucher is expired
voucherSchema.virtual('isExpired').get(function() {
    return new Date() > this.ngay_ket_thuc;
});

// Virtual property to check available quantity
voucherSchema.virtual('so_luong_con_lai').get(function() {
    return this.so_luong - this.da_su_dung;
});

// Middleware to update status based on dates and quantity
voucherSchema.pre('save', function(next) {
    if (new Date() > this.ngay_ket_thuc) {
        this.trang_thai = 'expired';
        // Tự động tắt popup khi voucher hết hạn
        this.popup = false;
    }
    if (this.da_su_dung >= this.so_luong) {
        this.trang_thai = 'expired'; // Or a new status like 'depleted'
        // Tự động tắt popup khi voucher hết số lượng
        this.popup = false;
    }
    next();
});

module.exports = mongoose.model('Voucher', voucherSchema); 
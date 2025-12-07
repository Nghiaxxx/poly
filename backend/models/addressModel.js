const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'users', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  address: { 
    type: String, 
    required: true 
  },
  province: { 
    type: String, 
    required: true 
  },
  district: { 
    type: String, 
    required: true 
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { versionKey: false });

// Đảm bảo chỉ có một địa chỉ mặc định cho mỗi user
addressSchema.pre('save', function(next) {
  if (this.isDefault) {
    // Nếu địa chỉ này được set làm mặc định, bỏ mặc định của các địa chỉ khác
    this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    ).exec();
  }
  this.updatedAt = Date.now();
  next();
});

// Index để tối ưu query
addressSchema.index({ userId: 1, isDefault: 1 });

module.exports = mongoose.model('Address', addressSchema, 'addresses'); 
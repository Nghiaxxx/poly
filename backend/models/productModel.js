const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    TenSP: { type: String, required: true },
    hinh: String,
    video: [String],
    hot: { type: Boolean, default: false },
    ban_chay: { 
      type: Number, 
      default: 0,
      min: 0, // Không cho phép âm
      validate: {
        validator: function(value) {
          // Chỉ cho phép tăng, không cho phép giảm trực tiếp
          if (this.isNew) {
            return value === 0; // Sản phẩm mới phải có ban_chay = 0
          }
          return true; // Cho phép cập nhật thông qua logic business
        },
        message: 'Sản phẩm mới phải có lượt bán = 0. Lượt bán chỉ có thể tăng thông qua đơn hàng thực tế.'
      }
    },
    khuyen_mai: { type: Number, default: 0 },
    an_hien: { type: Boolean, default: true },
    ngay_tao: { type: Date, default: Date.now },
    id_danhmuc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categories",
      required: true,
    },
    thong_so_ky_thuat: {
      CPU: String,
      Camera: [String],
      GPU: String,
      Cong_nghe_man_hinh: String,
      He_dieu_hanh: String,
      Do_phan_giai: String,
      Ket_noi: [String],
      Kich_thuoc_khoi_luong: [String],
      Kich_thuoc_man_hinh: String,
      Tien_ich_khac: [String],
      Tinh_nang_camera: [String]
    }
  },
  { versionKey: false }
);

// Middleware để bảo vệ field ban_chay
productSchema.pre('save', function(next) {
  // Nếu là sản phẩm mới, đảm bảo ban_chay = 0
  if (this.isNew) {
    this.ban_chay = 0;
    console.log(`🛡️  Sản phẩm mới được force ban_chay = 0 (không cho phép fake)`);
  }
  
  // Nếu cập nhật, kiểm tra không cho phép thay đổi ban_chay trực tiếp
  if (!this.isNew && this.isModified('ban_chay')) {
    console.log(`⚠️  Không cho phép thay đổi ban_chay trực tiếp từ ${this.ban_chay}. Giữ nguyên giá trị cũ.`);
    // Khôi phục giá trị ban_chay cũ
    this.ban_chay = this.constructor.findById(this._id).then(doc => {
      if (doc) {
        this.ban_chay = doc.ban_chay;
      }
    });
  }
  
  next();
});

// Middleware để bảo vệ field ban_chay khi update
productSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // Nếu cố gắng update ban_chay trực tiếp
  if (update.ban_chay !== undefined) {
    console.log(`🛡️  Không cho phép update trực tiếp field ban_chay: ${update.ban_chay}. Field này sẽ bị xóa.`);
    delete update.ban_chay; // Xóa field ban_chay khỏi update
  }
  
  next();
});

// Middleware để bảo vệ field ban_chay khi updateMany
productSchema.pre('updateMany', function(next) {
  const update = this.getUpdate();
  
  // Nếu cố gắng update ban_chay trực tiếp
  if (update.ban_chay !== undefined) {
    console.log(`🛡️  Không cho phép updateMany trực tiếp field ban_chay: ${update.ban_chay}. Field này sẽ bị xóa.`);
    delete update.ban_chay; // Xóa field ban_chay khỏi update
  }
  
  next();
});

// Middleware để bảo vệ field ban_chay khi updateOne
productSchema.pre('updateOne', function(next) {
  const update = this.getUpdate();
  
  // Nếu cố gắng update ban_chay trực tiếp
  if (update.ban_chay !== undefined) {
    console.log(`🛡️  Không cho phép updateOne trực tiếp field ban_chay: ${update.ban_chay}. Field này sẽ bị xóa.`);
    delete update.ban_chay; // Xóa field ban_chay khỏi update
  }
  
  next();
});

// Middleware để bảo vệ field ban_chay khi findByIdAndUpdate
productSchema.pre('findByIdAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // Nếu cố gắng update ban_chay trực tiếp
  if (update.ban_chay !== undefined) {
    console.log(`🛡️  Không cho phép findByIdAndUpdate trực tiếp field ban_chay: ${update.ban_chay}. Field này sẽ bị xóa.`);
    delete update.ban_chay; // Xóa field ban_chay khỏi update
  }
  
  next();
});

// Method để tăng ban_chay (chỉ được gọi từ order controller)
productSchema.methods.increaseSalesCount = function(quantity) {
  this.ban_chay += quantity;
  return this.save();
};

// Method để giảm ban_chay (chỉ được gọi từ order controller khi hủy đơn hàng)
productSchema.methods.decreaseSalesCount = function(quantity) {
  this.ban_chay = Math.max(0, this.ban_chay - quantity); // Không cho phép âm
  return this.save();
};

// Static method để tăng ban_chay cho nhiều sản phẩm
productSchema.statics.increaseSalesCountById = async function(productId, quantity) {
  return await this.findByIdAndUpdate(
    productId,
    { $inc: { ban_chay: quantity } },
    { new: true, runValidators: false } // Bỏ qua validation để cho phép tăng
  );
};

// Static method để giảm ban_chay cho nhiều sản phẩm
productSchema.statics.decreaseSalesCountById = async function(productId, quantity) {
  return await this.findByIdAndUpdate(
    productId,
    { $inc: { ban_chay: -Math.min(quantity, 0) } }, // Chỉ giảm, không cho phép âm
    { new: true, runValidators: false } // Bỏ qua validation để cho phép giảm
  );
};

module.exports = mongoose.model("products", productSchema);

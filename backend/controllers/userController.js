//chèn multer để upload file
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, './public/images')
  },
  filename: function(req, file, cb){
    cb(null, file.originalname)
  }
})
const checkfile = (req, file, cb) => {
  if(!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)){
    return cb(new Error('Bạn chỉ được upload file ảnh'))
  }
  return cb(null, true)
}
const upload = multer({storage: storage, fileFilter: checkfile})

const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//quên mk
const { sendEmail, sendResetPasswordEmail } = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const register = [upload.single('img'), async (req, res) => {
    try {
        // Kiểm tra email đã tồn tại chưa bằng hàm findOne()
        const checkUser = await userModel.findOne({
            email: req.body.email
        });
        if (checkUser) {
            throw new Error('Email đã tồn tại');
        }

        // Kiểm tra chính sách mật khẩu: tối thiểu 6 ký tự, gồm chữ, số và ký tự đặc biệt
        const password = req.body.password;
        const passwordPolicy = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
        if (!password || !passwordPolicy.test(password)) {
            return res.status(400).json({ message: 'Mật khẩu tối thiểu 6 ký tự, gồm chữ, số và ký tự đặc biệt' });
        }
        
        // Mã hóa mật khẩu bằng bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(req.body.password, salt);
        // Tạo một instance mới của userModel với đủ các trường
        const newUser = new userModel({
            Dia_chi: req.body.dia_chi,
            Sdt: req.body.Sdt,
            TenKH: req.body.TenKH,
            email: req.body.email,
            password: hashPassword,
            role: req.body.role || 'user',
            gioi_tinh: req.body.gioi_tinh,
            sinh_nhat: req.body.sinh_nhat,
            username: req.body.username,
            avatar: req.body.avatar,
        });
        // Lưu vào database bằng hàm save()
        const data = await newUser.save();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
]

const login = async (req, res) => {
    try {
        // Kiểm tra email có tồn tại không
        const checkUser = await userModel.findOne({
            email: req.body.email
        });
        
        if (!checkUser) {
            throw new Error('Email không tồn tại');
        }
        
        // Kiểm tra trạng thái active
        if (!checkUser.active) {
            throw new Error('Tài khoản đã bị tạm ngưng');
        }
        
        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(req.body.password, checkUser.password);
        if (!isMatch) {
            throw new Error('Mật khẩu không đúng');
        }
        
        // Cập nhật thời gian đăng nhập cuối
        checkUser.lastLogin = new Date();
        await checkUser.save();
        
        // Tạo token với mã bí mật là 'conguoiyeuchua' và thời gian sống là 1 giờ
        const token = jwt.sign({ id: checkUser._id, email: checkUser.email, role: checkUser.role }, 'conguoiyeuchua', { expiresIn: '10h' });
        res.json(token);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


//Bảo mật token
const verifyToken = (req, res, next) => {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Không có token hoặc format không đúng' });
    }
    
    const token = authHeader.slice(7);
    if (!token) {
        return res.status(403).json({ message: 'Không có token' });
    }
    
    // Xác thực token với mã bí mật
    jwt.verify(token, 'conguoiyeuchua', (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token đã hết hạn' });
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Token không hợp lệ' });
            }
            return res.status(401).json({ message: 'Lỗi xác thực token' });
        }
        // decoded chứa thông tin user đã mã hóa trong token và lưu vào req
        req.userId = decoded.id; 
        next();
    });
}

//lấy thông tin user khi có token
const getUser = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId, {
            password: 0,
            // Loại trừ các trường cũ nếu chúng vẫn tồn tại trong database
            dateOfBirth: 0,
            gender: 0,
            address: 0,
            name: 0, // Trường tên cũ
            phoneNumber: 0 // Trường số điện thoại cũ
        });
        if (!user) {
            throw new Error('Không tìm thấy user');
        }
        
        // Đảm bảo các trường mới được trả về
        const userResponse = {
            _id: user._id,
            TenKH: user.TenKH,
            email: user.email,
            Sdt: user.Sdt,
            gioi_tinh: user.gioi_tinh,
            sinh_nhat: user.sinh_nhat,
            dia_chi: user.dia_chi,
            tinh_thanh: user.tinh_thanh,
            quan_huyen: user.quan_huyen,
            username: user.username,
            avatar: user.avatar,
            role: user.role,
            active: user.active,
            lastLogin: user.lastLogin
        };
        
        res.json(userResponse);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Cập nhật thông tin user
const updateUser = [upload.single('avatar'), async (req, res) => {
    try {
        const { TenKH, Sdt, gioi_tinh, sinh_nhat, dia_chi, username, tinh_thanh, quan_huyen } = req.body;
        const userId = req.userId; // Lấy userId từ verifyToken

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tìm thấy.' });
        }

        // Cập nhật các trường
        user.TenKH = TenKH !== undefined ? TenKH : user.TenKH;
        user.Sdt = Sdt !== undefined ? Sdt : user.Sdt;
        user.gioi_tinh = gioi_tinh !== undefined ? gioi_tinh : user.gioi_tinh;
        user.sinh_nhat = sinh_nhat !== undefined ? sinh_nhat : user.sinh_nhat;
        user.dia_chi = dia_chi !== undefined ? dia_chi : user.dia_chi;
        user.username = username !== undefined ? username : user.username;
        user.tinh_thanh = tinh_thanh !== undefined ? tinh_thanh : user.tinh_thanh;
        user.quan_huyen = quan_huyen !== undefined ? quan_huyen : user.quan_huyen;

        if (req.file) {
            user.avatar = `/images/${req.file.filename}`;
        }

        const updatedUser = await user.save();

        // Trả về thông tin người dùng đã cập nhật, chỉ bao gồm các trường trong schema mới
        const userResponse = {
            _id: updatedUser._id,
            TenKH: updatedUser.TenKH,
            email: updatedUser.email,
            Sdt: updatedUser.Sdt,
            gioi_tinh: updatedUser.gioi_tinh,
            sinh_nhat: updatedUser.sinh_nhat,
            dia_chi: updatedUser.dia_chi,
            tinh_thanh: updatedUser.tinh_thanh,
            quan_huyen: updatedUser.quan_huyen,
            username: updatedUser.username,
            avatar: updatedUser.avatar,
            role: updatedUser.role,
        };

        res.json({ message: 'Cập nhật thông tin người dùng thành công', user: userResponse });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}];

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId; // Lấy userId từ verifyToken

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tìm thấy.' });
        }

        // So sánh mật khẩu cũ
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu cũ không đúng.' });
        }

        // Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashNewPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashNewPassword;
        await user.save();

        res.json({ message: 'Đổi mật khẩu thành công!' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//xác thực admin 
const verifyAdmin = async (req, res, next) => {
    try {
        // Lấy thông tin user từ id lưu trong req khi đã xác thực token
        const user = await userModel.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy user' });
        }
        
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền truy cập' });
        }
        
        next();
    }
    catch (error) {
        console.error('VerifyAdmin error:', error);
        res.status(500).json({ message: 'Lỗi xác thực admin: ' + error.message });
    }
}

//Lấy tất cả users
const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find({}, { password: 0 }); // Exclude password field
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
//quên mk
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      // Để bảo mật, vẫn trả về thành công (không tiết lộ email tồn tại hay không)
      return res.json({ message: "Nếu email tồn tại, mật khẩu mới đã được gửi." });
    }
    // Tạo mật khẩu mới ngẫu nhiên
    const newPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashPassword;
    await user.save();

    // Gửi email mật khẩu mới
    await sendResetPasswordEmail(email, newPassword);

    res.json({ message: "Nếu email tồn tại, mật khẩu mới đã được gửi." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Google Login
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      console.error('Google login: Missing token');
      return res.status(400).json({ message: 'Thiếu token Google' });
    }

    console.log('Google login: Verifying token with client ID:', GOOGLE_CLIENT_ID);

    // Xác thực token với Google
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      console.error('Google login: Invalid token payload');
      return res.status(400).json({ message: 'Token Google không hợp lệ' });
    }

    console.log('Google login: Token verified for email:', payload.email);

    // Tìm hoặc tạo user
    let user = await userModel.findOne({ email: payload.email });
    if (!user) {
      console.log('Google login: Creating new user for email:', payload.email);
      // Tạo password ngẫu nhiên cho user Google (không dùng để login)
      const randomPassword = Math.random().toString(36).slice(-12);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);
      
      user = new userModel({
        TenKH: payload.name || payload.email.split('@')[0],
        email: payload.email,
        password: hashedPassword, // Tạo password ngẫu nhiên để thỏa mãn required field
        username: payload.email, // Sử dụng email làm username để tránh unique constraint
        avatar: payload.picture,
        role: 'user',
        active: true, // Đảm bảo user được kích hoạt
      });
      await user.save();
    } else {
      console.log('Google login: Found existing user:', user._id);
      // Cập nhật thông tin nếu cần
      if (payload.picture && user.avatar !== payload.picture) {
        user.avatar = payload.picture;
        await user.save();
      }
    }

    // Tạo JWT token
    const jwtToken = jwt.sign({ id: user._id, email: user.email, role: user.role }, 'conguoiyeuchua', { expiresIn: '1h' });
    console.log('Google login: Success for user:', user._id);
    res.json({ token: jwtToken });
  } catch (error) {
    console.error('Google login error:', error);
    
    // Xử lý các lỗi cụ thể
    if (error.message.includes('Wrong number of segments')) {
      return res.status(400).json({ message: 'Token Google không đúng định dạng' });
    }
    if (error.message.includes('Token used too late')) {
      return res.status(400).json({ message: 'Token Google đã hết hạn' });
    }
    if (error.message.includes('Invalid audience')) {
      return res.status(400).json({ message: 'Token Google không hợp lệ cho ứng dụng này' });
    }
    
    res.status(500).json({ message: 'Đăng nhập Google thất bại', error: error.message });
  }
};

// Xóa user
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Kiểm tra user có tồn tại không
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user để xóa' });
    }

    // Kiểm tra không cho phép xóa admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Không thể xóa tài khoản admin' });
    }

    // Xóa user
    await userModel.findByIdAndDelete(userId);
    
    res.status(200).json({ message: 'Đã xóa user thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa user:', error);
    res.status(500).json({ message: 'Lỗi khi xóa user: ' + error.message });
  }
};

// Toggle trạng thái active của user
const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Kiểm tra user có tồn tại không
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    // Không cho phép thay đổi trạng thái của admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Không thể thay đổi trạng thái tài khoản admin' });
    }

    // Toggle trạng thái active
    user.active = !user.active;
    await user.save();
    
    res.status(200).json({ 
      message: user.active ? 'Đã kích hoạt user' : 'Đã tạm ngưng user',
      user: {
        _id: user._id,
        TenKH: user.TenKH,
        email: user.email,
        active: user.active,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Lỗi khi thay đổi trạng thái user:', error);
    res.status(500).json({ message: 'Lỗi khi thay đổi trạng thái user: ' + error.message });
  }
};

// Toggle role của user
const toggleUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    
    // Kiểm tra user có tồn tại không
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    // Kiểm tra role hợp lệ
    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ message: 'Role không hợp lệ' });
    }

    // Cập nhật role
    user.role = role;
    await user.save();
    
    res.status(200).json({ 
      message: role === 'admin' ? 'Đã cấp quyền admin cho user' : 'Đã hạ quyền user về user thường',
      user: {
        _id: user._id,
        TenKH: user.TenKH,
        email: user.email,
        active: user.active,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Lỗi khi thay đổi role user:', error);
    res.status(500).json({ message: 'Lỗi khi thay đổi role user: ' + error.message });
  }
};

// Thêm user từ admin
const addUserFromAdmin = async (req, res) => {
  try {
    const { TenKH, email, password, Sdt, dia_chi, gioi_tinh, sinh_nhat, role, active } = req.body;
    
    // Kiểm tra email đã tồn tại chưa
    const checkUser = await userModel.findOne({ email });
    if (checkUser) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    // Kiểm tra password theo chính sách: tối thiểu 6 ký tự, gồm chữ, số và ký tự đặc biệt
    const passwordPolicy = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!password || !passwordPolicy.test(password)) {
      return res.status(400).json({ message: 'Mật khẩu tối thiểu 6 ký tự, gồm chữ, số và ký tự đặc biệt' });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // Tạo user mới
    const newUser = new userModel({
      TenKH: TenKH,
      email: email,
      password: hashPassword,
      Sdt: Sdt || '',
      dia_chi: dia_chi || '',
      gioi_tinh: gioi_tinh || '',
      sinh_nhat: sinh_nhat || '',
      role: role || 'user',
      active: active !== undefined ? active : true,
      ngay_tao: new Date()
    });

    const savedUser = await newUser.save();
    
    // Trả về user đã tạo (không bao gồm password)
    const userResponse = {
      _id: savedUser._id,
      TenKH: savedUser.TenKH,
      email: savedUser.email,
      Sdt: savedUser.Sdt,
      dia_chi: savedUser.dia_chi,
      gioi_tinh: savedUser.gioi_tinh,
      sinh_nhat: savedUser.sinh_nhat,
      role: savedUser.role,
      active: savedUser.active,
      ngay_tao: savedUser.ngay_tao
    };

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Lỗi khi thêm user từ admin:', error);
    res.status(500).json({ message: 'Lỗi khi thêm user: ' + error.message });
  }
};

// Cập nhật user từ admin
const updateUserFromAdmin = async (req, res) => {
  try {
    const userId = req.params.id;
    const { TenKH, email, Sdt, dia_chi, gioi_tinh, sinh_nhat, role, active } = req.body;
    
    // Kiểm tra user có tồn tại không
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    // Kiểm tra email có bị trùng với user khác không (nếu email thay đổi)
    if (email && email !== user.email) {
      const existingUser = await userModel.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã tồn tại' });
      }
    }

    // Cập nhật các trường
    if (TenKH !== undefined) user.TenKH = TenKH;
    if (email !== undefined) user.email = email;
    if (Sdt !== undefined) user.Sdt = Sdt;
    if (dia_chi !== undefined) user.dia_chi = dia_chi;
    if (gioi_tinh !== undefined) user.gioi_tinh = gioi_tinh;
    if (sinh_nhat !== undefined) user.sinh_nhat = sinh_nhat;
    if (role !== undefined) user.role = role;
    if (active !== undefined) user.active = active;

    const updatedUser = await user.save();
    
    // Trả về user đã cập nhật (không bao gồm password)
    const userResponse = {
      _id: updatedUser._id,
      TenKH: updatedUser.TenKH,
      email: updatedUser.email,
      Sdt: updatedUser.Sdt,
      dia_chi: updatedUser.dia_chi,
      gioi_tinh: updatedUser.gioi_tinh,
      sinh_nhat: updatedUser.sinh_nhat,
      role: updatedUser.role,
      active: updatedUser.active,
      ngay_tao: updatedUser.ngay_tao
    };

    res.json(userResponse);
  } catch (error) {
    console.error('Lỗi khi cập nhật user từ admin:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật user: ' + error.message });
  }
};

module.exports = { register, login, getUser, verifyToken, verifyAdmin, getAllUsers, updateUser, upload, changePassword, forgotPassword, googleLogin, deleteUser, toggleUserStatus, toggleUserRole, addUserFromAdmin, updateUserFromAdmin };
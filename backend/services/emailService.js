require("dotenv").config();
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const UserEvent = require("../models/userEventModel");
const User = require("../models/userModel");

// Tạo transporter cho Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Email Gmail của bạn
    pass: process.env.EMAIL_PASSWORD, // App password từ Gmail
  },
});

// Hàm gửi email voucher
const sendVoucherEmail = async (userEmail, userName, voucherCode) => {
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD);
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "🎁 Chúc mừng! Bạn đã nhận được voucher từ Poly Smart",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #E53935; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🎉 CHÚC MỪNG!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Bạn đã nhận được voucher từ Poly Smart</p>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Xin chào <strong>${userName}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Cảm ơn bạn đã tham gia chương trình nhận voucher của Poly Smart! 
              Dưới đây là thông tin voucher của bạn:
            </p>
            
            <div style="background-color: #f8f9fa; border: 2px dashed #E53935; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
              <h2 style="color: #E53935; margin: 0 0 10px 0; font-size: 18px;">MÃ VOUCHER CỦA BẠN</h2>
              <div style="background-color: #E53935; color: white; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                ${voucherCode}
              </div>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">📋 Thông tin voucher:</h3>
              <ul style="color: #856404; margin: 0; padding-left: 20px;">
                <li><strong>Giảm giá:</strong> 10% (tối đa 150.000đ)</li>
                <li><strong>Hạn sử dụng:</strong> 01.07.2025</li>
                <li><strong>Áp dụng:</strong> Mua hàng Online tại Poly Smart</li>
              </ul>
            </div>
            
            <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h3 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px;">📞 Hỗ trợ:</h3>
              <p style="color: #0c5460; margin: 0;">
                Gọi tổng đài <strong>1800.6601</strong> miễn phí hoặc đến cửa hàng để được hỗ trợ nhanh hơn.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
              Trân trọng,<br>
              <strong>Đội ngũ Poly Smart</strong>
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error };
  }
};

function generateVoucherCode(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return "POLY-" + code;
}

async function sendEmail(to, voucherCode) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "polysmart79@gmail.com",
      pass: "osqo augq eamh xkti",
    },
  });

  await transporter.sendMail({
    from: "Poly Smart <your-email@gmail.com>",
    to,
    subject: "Mã giảm giá dành cho bạn!",
    text: `Bạn nhận được mã giảm giá 500.000đ cho sản phẩm bạn quan tâm!\nMã giảm giá của bạn: ${voucherCode}`,
  });
}

//gửi email quên mk
async function sendResetPasswordEmail(to, newPassword) {
  try {
    console.log("Sending reset password email to:", to);
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log(
      "EMAIL_PASSWORD:",
      process.env.EMAIL_PASSWORD ? "***" : "NOT SET"
    );

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error("Email configuration not set");
    }

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `Poly Smart <${process.env.EMAIL_USER}>`,
      to: to,
      subject: "🔐 Mật khẩu mới từ Poly Smart",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #0066D6; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🔐 Đặt lại mật khẩu</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Poly Smart - Mật khẩu mới của bạn</p>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Xin chào,
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Poly Smart. 
              Dưới đây là mật khẩu mới của bạn:
            </p>
            
            <div style="background-color: #f8f9fa; border: 2px dashed #0066D6; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
              <h2 style="color: #0066D6; margin: 0 0 10px 0; font-size: 18px;">MẬT KHẨU MỚI</h2>
              <div style="background-color: #0066D6; color: white; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                ${newPassword}
              </div>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">⚠️ Lưu ý quan trọng:</h3>
              <ul style="color: #856404; margin: 0; padding-left: 20px;">
                <li>Vui lòng đăng nhập ngay với mật khẩu mới</li>
                <li>Đổi mật khẩu thành mật khẩu mạnh hơn sau khi đăng nhập</li>
                <li>Không chia sẻ mật khẩu này với bất kỳ ai</li>
              </ul>
            </div>
            
            <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h3 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px;">📞 Hỗ trợ:</h3>
              <p style="color: #0c5460; margin: 0;">
                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ hỗ trợ ngay lập tức.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
              Trân trọng,<br>
              <strong>Đội ngũ Poly Smart</strong>
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Reset password email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending reset password email:", error);
    throw error;
  }
}

module.exports = {
  sendVoucherEmail,
  sendEmail,
  generateVoucherCode,
  sendResetPasswordEmail,
};

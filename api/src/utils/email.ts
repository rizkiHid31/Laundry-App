import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  verificationToken: string
): Promise<boolean> => {
  try {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const htmlContent = `
      <h2>Welcome to LaundryApp!</h2>
      <p>Hello ${firstName},</p>
      <p>Thank you for signing up. Please verify your email to complete your registration.</p>
      <p><a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't create this account, please ignore this email.</p>
      <hr>
      <p>LaundryApp Team</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - LaundryApp',
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

export const sendResetPasswordEmail = async (
  email: string,
  firstName: string,
  resetToken: string
): Promise<boolean> => {
  try {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <h2>Reset Your Password</h2>
      <p>Hello ${firstName},</p>
      <p>We received a request to reset your password. Click the link below to proceed.</p>
      <p><a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
      <hr>
      <p>LaundryApp Team</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your Password - LaundryApp',
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('Error sending reset password email:', error);
    return false;
  }
};

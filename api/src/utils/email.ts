import nodemailer from 'nodemailer';

const isDevEmail = () =>
  !process.env.EMAIL_USER ||
  process.env.EMAIL_USER.includes('your-email') ||
  process.env.NODE_ENV === 'development';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const logDevLink = (label: string, link: string) => {
  console.log(`\n📧 [DEV EMAIL] ${label}`);
  console.log(link);
  console.log('');
};

export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  verificationToken: string
): Promise<boolean> => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  if (isDevEmail()) {
    logDevLink(`Verifikasi untuk ${email}`, verificationLink);
    return true;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - LaundryApp',
      html: `
        <h2>Welcome to LaundryApp!</h2>
        <p>Hello ${firstName},</p>
        <p><a href="${verificationLink}">Verify Email</a></p>
        <p>Link expires in 1 hour.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    logDevLink(`Fallback verifikasi untuk ${email}`, verificationLink);
    return true;
  }
};

export const sendResetPasswordEmail = async (
  email: string,
  firstName: string,
  resetToken: string
): Promise<boolean> => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  if (isDevEmail()) {
    logDevLink(`Reset password untuk ${email}`, resetLink);
    return true;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your Password - LaundryApp',
      html: `
        <h2>Reset Password</h2>
        <p>Hello ${firstName},</p>
        <p><a href="${resetLink}">Reset Password</a></p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending reset email:', error);
    logDevLink(`Fallback reset untuk ${email}`, resetLink);
    return true;
  }
};

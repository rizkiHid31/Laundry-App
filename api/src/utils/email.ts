import nodemailer from 'nodemailer';

const isPlaceholderEmailConfig = () => {
  const service = process.env.EMAIL_SERVICE?.trim();
  const host = process.env.EMAIL_HOST?.trim();
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASSWORD?.trim();

  return (
    !user ||
    !pass ||
    user.includes('your-email') ||
    pass.includes('your-app') ||
    (!service && !host)
  );
};

const emailConfigured = !isPlaceholderEmailConfig();

const createSmtpTransport = () => {
  const transportOptions: any = {
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  };

  const service = process.env.EMAIL_SERVICE?.trim();
  const host = process.env.EMAIL_HOST?.trim();
  const port = process.env.EMAIL_PORT?.trim();

  if (service) {
    transportOptions.service = service;
  }

  if (host) {
    transportOptions.host = host;
  }

  if (port) {
    transportOptions.port = parseInt(port, 10);
    transportOptions.secure = port === '465';
  }

  return nodemailer.createTransport(transportOptions);
};

const transporter = emailConfigured ? createSmtpTransport() : null;

if (emailConfigured && transporter && 'verify' in transporter) {
  transporter.verify((error) => {
    if (error) {
      console.error('[EMAIL] SMTP verification failed:', error);
      console.error('[EMAIL] Please check EMAIL_SERVICE, EMAIL_USER, EMAIL_PASSWORD, and EMAIL_HOST/EMAIL_PORT settings.');
    } else {
      console.info('[EMAIL] SMTP transporter is ready to send messages.');
    }
  });
}

export const isEmailConfigured = (): boolean => emailConfigured;

export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  verificationToken: string
): Promise<boolean> => {
  if (!emailConfigured || !transporter) {
    console.warn('[EMAIL] SMTP is not configured. Verification email was not sent.');
    return false;
  }

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
  if (!emailConfigured || !transporter) {
    console.warn('[EMAIL] SMTP is not configured. Reset password email was not sent.');
    return false;
  }

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

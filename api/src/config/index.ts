import "dotenv/config";

export const config = {
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || "development",
  baseUrl: process.env.BASE_URL || "http://localhost:8000",
  webUrl: process.env.WEB_URL || "http://localhost:5173",

  jwt: {
    secret: process.env.JWT_SECRET || "fallback_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "",
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },

  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY || "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  },
};

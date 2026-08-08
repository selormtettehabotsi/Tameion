const nodemailer = require('nodemailer');

// In development, logs to console. In production, uses SMTP config from env vars.
const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const FROM = process.env.EMAIL_FROM || 'Tameion Library <noreply@tameion.knust.edu.gh>';
const BASE_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function sendMail({ to, subject, html }) {
  if (!transport) {
    console.log(`[mail] To: ${to} | Subject: ${subject}`);
    console.log(`[mail] Body preview: ${html.replace(/<[^>]+>/g, '').slice(0, 200)}`);
    return;
  }
  await transport.sendMail({ from: FROM, to, subject, html });
}

async function sendVerificationEmail(email, name, token) {
  const link = `${BASE_URL}/verify-email?token=${token}`;
  await sendMail({
    to: email,
    subject: 'Verify your Tameion account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1a1a1a">Welcome to Tameion, ${name}!</h2>
        <p style="color:#555;line-height:1.6">Please verify your email address to activate your library account.</p>
        <a href="${link}" style="display:inline-block;background:#6750a4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Verify Email</a>
        <p style="color:#888;font-size:13px">Or copy this link: <br/>${link}</p>
        <p style="color:#888;font-size:13px">This link expires in 24 hours.</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(email, name, token) {
  const link = `${BASE_URL}/reset-password?token=${token}`;
  await sendMail({
    to: email,
    subject: 'Reset your Tameion password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1a1a1a">Password Reset</h2>
        <p style="color:#555;line-height:1.6">Hi ${name}, we received a request to reset your password.</p>
        <a href="${link}" style="display:inline-block;background:#6750a4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Reset Password</a>
        <p style="color:#888;font-size:13px">Or copy this link: <br/>${link}</p>
        <p style="color:#888;font-size:13px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };

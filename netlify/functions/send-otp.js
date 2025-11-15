// netlify/functions/send-otp.js
const nodemailer = require('nodemailer');

// Hardcoded for dev (never in prod!)
const GMAIL_USER = 'vidhigyansodh.official@gmail.com'; // ← REPLACE WITH YOUR GMAIL
const GMAIL_APP_PASSWORD = 'cpkw vsec lcqh hrav'; // ← YOUR 16-CHAR APP PASSWORD

// In-memory store (use Redis or DB in prod)
const otpStore = new Map();

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { email } = JSON.parse(event.body);

    if (!email || !email.includes('@')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email' }) };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    // Save OTP (in prod: save to DB)
    otpStore.set(email, { otp, expiresAt });

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: GMAIL_USER,
      to: email,
      subject: 'Your OTP Code - Vidhi Gyan',
      text: `Your OTP code is: ${otp}\nIt expires in 10 minutes.`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('OTP Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send OTP' }),
    };
  }
};
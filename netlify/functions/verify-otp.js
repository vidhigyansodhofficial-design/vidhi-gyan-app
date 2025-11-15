// netlify/functions/verify-otp.js
// In-memory (use DB in prod)
const otpStore = new Map(); // Share with send-otp? → No. So use DB.

// For demo, we'll simulate stored OTP
// In real app: query your DB for OTP

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { email, otp } = JSON.parse(event.body);

    // 🔐 In real app: query your DB
    // For now: simulate success (you can store in Supabase `otp_requests`)
    const valid = otp === '123456'; // ← For testing only

    // Later: replace with real DB check

    return {
      statusCode: 200,
      body: JSON.stringify({ valid }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Verification failed' }),
    };
  }
};
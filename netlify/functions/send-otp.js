import nodemailer from "nodemailer";
import { supabase } from "./supabaseClient.js";

export async function handler(event) {
  try {
    const { email, full_name } = JSON.parse(event.body);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expires = new Date(Date.now() + 5 * 60 * 1000);

    await supabase.from("users").upsert({
      email,
      full_name,
      otp,
      otp_expires_at: expires,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "vidhigyanShodh.official@gmail.com",
        pass: "ngzv gmty yuig fyun",
      },
    });

    await transporter.sendMail({
      from: "Vidhi Gyan Shodh <vidhigyanShodh.official@gmail.com>",
      to: email,
      subject: "Your OTP - Vidhi Gyan Shodh",
      html: `<h2>Your OTP is <b>${otp}</b></h2><p>Valid for 5 minutes</p>`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return { statusCode: 500, body: err.toString() };
  }
}

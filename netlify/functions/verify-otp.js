import { supabase } from "./supabaseClient.js";

export async function handler(event) {
  const { email, otp } = JSON.parse(event.body);

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (!data || data.otp !== otp || new Date(data.otp_expires_at) < new Date()) {
    return { statusCode: 401, body: "Invalid OTP" };
  }

  await supabase.from("users").update({
    otp: null,
    otp_expires_at: null,
  }).eq("email", email);

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, user: data }),
  };
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { token, user_id } = await req.json();

    if (!token || !user_id) {
      return NextResponse.json({ success: false, error: "Missing token or user_id" }, { status: 400 });
    }

    // Ambil row trust user
    let { data: trustRow } = await supabase
      .from("user_trust")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (!trustRow) {
      trustRow = { trust_score: 0, failed_attempts: 0, blocked_until: null };
      await supabase.from("user_trust").insert({ user_id, ...trustRow });
    }

    // Verifikasi ke Google reCAPTCHA
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      console.error("RECAPTCHA_SECRET_KEY not set");
      return NextResponse.json({ success: false, error: "Server config error" }, { status: 500 });
    }

    const verifyURL = `https://www.google.com/recaptcha/api/siteverify`;
    const verifyParams = new URLSearchParams({
      secret: secret,
      response: token,
    });

    const verifyResponse = await fetch(`${verifyURL}?${verifyParams}`, {
      method: "POST",
    });

    const googleData = await verifyResponse.json();
    console.log("Google reCAPTCHA Response:", googleData); // Debug log

    const passed = googleData.success;

    // Kalau captcha gagal
    if (!passed) {
      let failedAttempts = (trustRow.failed_attempts || 0) + 1;
      const updates = { failed_attempts: failedAttempts };

      if (failedAttempts >= 5) {
        updates.blocked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // block 30 menit
      }

      await supabase.from("user_trust").upsert({ user_id, ...updates });
      return NextResponse.json({ 
        success: false, 
        failedAttempts,
        error: "Verification failed",
        "error-codes": googleData["error-codes"] 
      });
    }

    // Kalau lolos captcha → reset failed_attempts dan update trust_score
    await supabase.from("user_trust").upsert({
      user_id,
      failed_attempts: 0,
      blocked_until: null,
      trust_score: Math.min(trustRow.trust_score + 0.1, 1.0) // Increment trust score, max 1.0
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
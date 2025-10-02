import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 400 }
      );
    }

    // Kirim token ke Google untuk verifikasi
    const secret = process.env.RECAPTCHA_SECRET_KEY;

    const verifyRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${secret}&response=${token}`,
      }
    );

    const data = await verifyRes.json();

    if (data.success) {
      return NextResponse.json({ success: true, score: data.score });
    } else {
      return NextResponse.json(
        { success: false, error: data["error-codes"] || "Failed verification" },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Captcha verify error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "reCAPTCHA verify endpoint ready 🚀" });
}

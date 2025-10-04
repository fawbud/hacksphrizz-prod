import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export async function POST(req) {
  const { user_id } = await req.json();

  // Ambil trust score terakhir
  let { data: trustRow } = await supabase
    .from("user_trust")
    .select("trust_score, failed_attempts, blocked_until")
    .eq("user_id", user_id)
    .single();

  // Jika user baru, set default 0.1 (low trust - requires captcha)
  if (!trustRow) {
    await supabase.from("user_trust").insert({ user_id, trust_score: 0.1 });
    trustRow = { trust_score: 0.1, failed_attempts: 0, blocked_until: null };
  }

  // Check apakah blocked
  const now = new Date();
  let isBlocked = trustRow.blocked_until && new Date(trustRow.blocked_until) > now;

  return NextResponse.json({
    trust_score: trustRow.trust_score, // Already 0-1 scale
    failed_attempts: trustRow.failed_attempts,
    showCaptcha: isBlocked || trustRow.trust_score <= 0.45, // Consistent threshold
    isBlocked
  });
}

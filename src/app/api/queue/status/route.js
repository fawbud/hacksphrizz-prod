import { supabaseAdmin } from '@/utils/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required' 
      }, { status: 400 });
    }

    // Ambil data user saat ini dari antrian
    const { data: userData, error: userError } = await supabaseAdmin
      .from('queue')
      .select('status, enqueued_at, trust_level, trust_score')
      .eq('user_id', userId)
      .single();

    if (userError || !userData) {
      // Jika tidak ditemukan, kemungkinan besar sudah lolos (passed)
      return NextResponse.json({ status: 'passed' });
    }

    if (userData.status !== 'waiting') {
      return NextResponse.json({ 
        status: userData.status,
        trustLevel: userData.trust_level,
        trustScore: userData.trust_score
      });
    }

    // Hitung posisi user dalam antrian
    const { count, error: countError } = await supabaseAdmin
      .from('queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting')
      .lt('enqueued_at', userData.enqueued_at); // lt = less than

    if (countError) {
      console.error('Error counting queue position:', countError);
      return NextResponse.json({ 
        error: countError.message 
      }, { status: 500 });
    }

    // Hitung total users waiting
    const { count: totalWaiting, error: totalError } = await supabaseAdmin
      .from('queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting');

    if (totalError) {
      console.error('Error counting total waiting:', totalError);
    }

    return NextResponse.json({
      position: count + 1,
      status: 'waiting',
      totalWaiting: totalWaiting || 0,
      trustLevel: userData.trust_level,
      trustScore: userData.trust_score,
      // Kirim flag untuk adaptive verification
      requiresCaptcha: userData.trust_level === 'Low',
      estimatedWaitTime: Math.round((count + 1) * 2) // Estimasi: 2 detik per user
    });

  } catch (error) {
    console.error('Unexpected error in status check:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
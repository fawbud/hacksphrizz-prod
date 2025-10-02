import { supabaseAdmin } from '../../../utils/supabase.js';
import { calculateTrustScore, validateMetrics } from '../../../utils/scoring.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, metrics } = body;

    if (!userId || !metrics) {
      return NextResponse.json({ 
        error: 'userId and metrics are required' 
      }, { status: 400 });
    }

    // Validasi format metrics
    const validation = validateMetrics(metrics);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Invalid metrics format',
        details: validation.errors
      }, { status: 400 });
    }

    // Hitung trust score baru
    const trustResult = calculateTrustScore(metrics);

    // Update data di Supabase
    const { data, error } = await supabaseAdmin
      .from('queue')
      .update({ 
        trust_score: trustResult.score, 
        trust_level: trustResult.level 
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating trust score:', error);
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 });
    }

    // Log behavior data untuk analysis (optional)
    await supabaseAdmin
      .from('behavior_logs')
      .insert([{
        user_id: userId,
        metrics,
        trust_score: trustResult.score,
        trust_level: trustResult.level,
        reasons: trustResult.reasons,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    return NextResponse.json({ 
      message: 'Trust score updated successfully',
      trustScore: trustResult.score,
      trustLevel: trustResult.level,
      reasons: trustResult.reasons,
      requiresCaptcha: trustResult.level === 'Low'
    });

  } catch (error) {
    console.error('Unexpected error in behavior tracking:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
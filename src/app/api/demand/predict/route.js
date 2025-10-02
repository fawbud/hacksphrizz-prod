import { supabaseAdmin } from '../../../utils/supabase.js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Ambil config waiting room status
    const { data, error } = await supabaseAdmin
      .from('config')
      .select('is_waiting_room_active')
      .single();

    if (error) {
      console.error('Error fetching config:', error);
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      isWaitingRoomActive: data?.is_waiting_room_active || false
    });

  } catch (error) {
    console.error('Unexpected error in demand prediction check:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { isActive, secret } = body;

    // Proteksi dengan secret key
    if (secret !== process.env.QUEUE_SECRET) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Dummy AI logic - dalam implementasi real, ini bisa dipicu oleh:
    // - Monitoring real-time traffic
    // - Scheduled analysis
    // - Manual trigger
    const aiPrediction = await runDummyAIAnalysis();

    // Update config berdasarkan AI prediction atau manual override
    const activeStatus = isActive !== undefined ? isActive : aiPrediction.shouldActivate;

    const { data, error } = await supabaseAdmin
      .from('config')
      .upsert([{ 
        id: 1, // Single config row
        is_waiting_room_active: activeStatus,
        last_updated: new Date().toISOString(),
        ai_confidence: aiPrediction.confidence,
        trigger_reason: aiPrediction.reason
      }])
      .select()
      .single();

    if (error) {
      console.error('Error updating config:', error);
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Waiting room status updated',
      isActive: activeStatus,
      aiPrediction,
      success: true
    });

  } catch (error) {
    console.error('Unexpected error in demand prediction update:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

async function runDummyAIAnalysis() {
  try {
    // Ambil metrics dari database
    const currentHour = new Date().getHours();
    
    // Simulasi metrics
    const { count: currentUsers } = await supabaseAdmin
      .from('queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting');

    const { count: totalUsersToday } = await supabaseAdmin
      .from('queue')
      .select('*', { count: 'exact', head: true })
      .gte('enqueued_at', new Date().toISOString().split('T')[0]);

    // Dummy AI logic
    let shouldActivate = false;
    let confidence = 0.5;
    let reason = 'Normal traffic detected';

    // Peak hours detection (9-11 AM, 1-3 PM, 7-9 PM)
    const isPeakHour = (currentHour >= 9 && currentHour <= 11) ||
                       (currentHour >= 13 && currentHour <= 15) ||
                       (currentHour >= 19 && currentHour <= 21);

    if (isPeakHour && currentUsers > 10) {
      shouldActivate = true;
      confidence = 0.8;
      reason = 'Peak hour with high current users';
    } else if (currentUsers > 20) {
      shouldActivate = true;
      confidence = 0.9;
      reason = 'High current user count';
    } else if (totalUsersToday > 100) {
      shouldActivate = true;
      confidence = 0.7;
      reason = 'High daily traffic volume';
    }

    // Add some randomness for demo purposes
    if (Math.random() > 0.8) {
      shouldActivate = !shouldActivate;
      reason += ' (random factor applied)';
      confidence = Math.max(0.3, confidence - 0.2);
    }

    return {
      shouldActivate,
      confidence,
      reason,
      metrics: {
        currentUsers: currentUsers || 0,
        totalUsersToday: totalUsersToday || 0,
        currentHour,
        isPeakHour
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in AI analysis:', error);
    return {
      shouldActivate: false,
      confidence: 0.1,
      reason: 'AI analysis failed, defaulting to inactive',
      error: error.message
    };
  }
}
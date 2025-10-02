import { supabaseAdmin } from '../../../utils/supabase.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { count, secret } = body;

    // Proteksi dengan secret key
    if (secret !== process.env.QUEUE_SECRET) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    if (!count || count < 1) {
      return NextResponse.json({ 
        error: 'Count must be a positive number' 
      }, { status: 400 });
    }

    // Gunakan RPC function untuk dequeue (akan dibuat di database)
    const { data, error } = await supabaseAdmin.rpc('dequeue_users', { 
      limit_count: count 
    });

    if (error) {
      console.error('Error dequeuing users:', error);
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `${data?.length || 0} users dequeued`, 
      dequeuedUsers: data || [],
      success: true
    });

  } catch (error) {
    console.error('Unexpected error in dequeue:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
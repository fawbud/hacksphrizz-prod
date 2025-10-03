import { supabaseAdmin } from '@/utils/supabase';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Insert user baru ke queue dengan default values
    const { data, error } = await supabaseAdmin
      .from('queue')
      .insert([{}]) // Kolom default akan terisi otomatis
      .select('user_id') // Minta kembali user_id yang baru dibuat
      .single();

    if (error) {
      console.error('Error enqueueing user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      userId: data.user_id, 
      status: 'queued',
      message: 'Successfully added to queue'
    });

  } catch (error) {
    console.error('Unexpected error in enqueue:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
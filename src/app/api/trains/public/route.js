import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role for public API
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// CORS headers for CrowdHandler waiting room
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const trainId = searchParams.get('train_id');

    // If train_id is provided, filter by matching departure/destination
    if (trainId) {
      // First get the train details
      const { data: train, error: trainError } = await supabase
        .from('trains')
        .select('arrival_station_code, departure_station_code')
        .eq('id', trainId)
        .single();

      if (trainError || !train) {
        return NextResponse.json(
          { error: 'Train not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // Get all trains with matching destination and available seats
      const { data, error } = await supabase
        .from('trains')
        .select('*')
        .eq('departure_station_code', train.departure_station_code)
        .eq('arrival_station_code', train.arrival_station_code)
        .gt('total_seats', 0)
        .eq('is_active', true)
        .order('departure_time', { ascending: true });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json({ trains: data || [] }, { headers: corsHeaders });
    }

    // Otherwise, return all trains
    const { data, error } = await supabase
      .from('trains')
      .select('*')
      .eq('is_active', true)
      .order('departure_time', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({ trains: data || [] }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching trains:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

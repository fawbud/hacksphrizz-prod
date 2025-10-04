import { createClient } from '@supabase/supabase-js';

// Client untuk operasi frontend (menggunakan anon key)
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Client untuk operasi backend/admin (menggunakan service key)
// Only create if we have a valid service key
// Check both possible env variable names for compatibility
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Debug logging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔑 Supabase Admin Client Initialization:');
  console.log('  - URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('  - Service Role Key:', serviceRoleKey ? `✅ Set (${serviceRoleKey.substring(0, 20)}...)` : '❌ Missing');
}

export const supabaseAdmin = serviceRoleKey &&
  serviceRoleKey !== 'your_actual_service_key_here_from_supabase_dashboard' &&
  serviceRoleKey !== 'your_service_role_key' ?
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey
  ) : null;

// Log initialization result
if (process.env.NODE_ENV === 'development') {
  console.log('  - Admin Client:', supabaseAdmin ? '✅ Initialized' : '❌ Not initialized');
}
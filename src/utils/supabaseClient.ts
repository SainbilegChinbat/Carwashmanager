import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL configured:', !!supabaseUrl);
console.log('Supabase Anon Key configured:', !!supabaseAnonKey);
console.log('isSupabaseConfigured:', !isPlaceholder);

// Check if environment variables are properly configured
const isPlaceholder = !supabaseUrl || !supabaseAnonKey;

if (isPlaceholder) {
  console.warn(
    'Supabase тохиргоо дутуу байна. "Connect to Supabase" товчийг дарж Supabase төслөө холбоно уу.\n\n' +
    'Эсвэл .env файлд VITE_SUPABASE_URL болон VITE_SUPABASE_ANON_KEY-г зөв утгаар тохируулна уу.\n\n' +
    'Жишээ нь:\n' +
    'VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key-here'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = !isPlaceholder;

// Initialize realtime subscriptions
export const initializeRealtimeSubscriptions = (userId: string) => {
  if (!isSupabaseConfigured) return null;
  
  // Subscribe to services table changes (which includes categories)
  const subscription = supabase
    .channel('services-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'services',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Realtime update received:', payload);
        // Dispatch a custom event that components can listen for
        window.dispatchEvent(new CustomEvent('supabase-services-update', { detail: payload }));
      }
    )
    .subscribe();
    
  return subscription;
};
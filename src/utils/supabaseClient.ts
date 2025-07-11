import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase URL configured:', !!supabaseUrl);
console.log('Supabase Anon Key configured:', !!supabaseAnonKey);

// Check if environment variables are properly configured
const isPlaceholder = !supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'your_supabase_project_url_here' || 
    supabaseAnonKey === 'your_supabase_anon_key_here';

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
export const initializeRealtimeSubscriptions = (userId: string, forceRefresh?: () => void) => {
  if (!isSupabaseConfigured) return null;
  
  try {
    console.log('Initializing realtime subscriptions for user:', userId);
    
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
          console.log('Realtime update received for services:', payload);
          // Dispatch a custom event that components can listen for
          window.dispatchEvent(new CustomEvent('supabase-services-update', { detail: payload }));
          
          // Force refresh if callback provided
          if (forceRefresh) {
            console.log('Forcing refresh of services data');
            forceRefresh();
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
    
    return subscription;
  } catch (error) {
    console.error('Error initializing realtime subscriptions:', error);
    return null;
  }
};
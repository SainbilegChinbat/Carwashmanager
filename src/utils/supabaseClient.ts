import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
const isPlaceholder = !supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'your_supabase_project_url_here' || 
    supabaseAnonKey === 'your_supabase_anon_key_here' ||
    supabaseUrl === 'https://placeholder.supabase.co' ||
    supabaseAnonKey === 'placeholder-anon-key';

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
    }
  }
);

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = !isPlaceholder;
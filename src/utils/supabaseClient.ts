import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('VITE_SUPABASE_URL from import.meta.env:', supabaseUrl);
console.log('VITE_SUPABASE_ANON_KEY from import.meta.env:', supabaseAnonKey);

// Check if environment variables are properly configured
const isPlaceholder = !supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'https://nqpqgvslqlafipvypach.supabase.co' || 
    supabaseAnonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcHFndnNscWxhZmlwdnlwYWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyODg5NTMsImV4cCI6MjA2Njg2NDk1M30.mi3MsPOLbaX0I6R0YdwJLd1GVchkXeoj3LUPN4uw4TE' ||
    supabaseUrl === 'https://nqpqgvslqlafipvypach.supabase.co' ||
    supabaseAnonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcHFndnNscWxhZmlwdnlwYWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyODg5NTMsImV4cCI6MjA2Njg2NDk1M30.mi3MsPOLbaX0I6R0YdwJLd1GVchkXeoj3LUPN4uw4TE';

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
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if environment variables are properly configured
const isPlaceholder = !supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'your_supabase_project_url_here' || 
    supabaseAnonKey === 'your_supabase_anon_key_here';

// Simplify warning to avoid console spam
if (isPlaceholder) console.warn('Supabase configuration missing or invalid');

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

// Initialize realtime subscriptions for all tables
export const initializeRealtimeSubscriptions = (userId: string) => {
  if (!isSupabaseConfigured) return null;
  
  try {
    console.log('Initializing realtime subscriptions for user:', userId);
    
    // Create a single channel for all table changes
    const channel = supabase.channel('db-changes');
    
    // Subscribe to services table
    channel.on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'services',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Realtime update received for services:', payload);
        window.dispatchEvent(new CustomEvent('supabase-services-update', { detail: payload }));
      }
    );
    
    // Subscribe to employees table
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'employees',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Realtime update received for employees:', payload);
        window.dispatchEvent(new CustomEvent('supabase-employees-update', { detail: payload }));
      }
    );
    
    // Subscribe to transactions table
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Realtime update received for transactions:', payload);
        window.dispatchEvent(new CustomEvent('supabase-transactions-update', { detail: payload }));
      }
    );
    
    // Subscribe to pending_services table
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pending_services',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Realtime update received for pending services:', payload);
        window.dispatchEvent(new CustomEvent('supabase-pending-services-update', { detail: payload }));
      }
    );
    
    // Subscribe to appointments table
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Realtime update received for appointments:', payload);
        window.dispatchEvent(new CustomEvent('supabase-appointments-update', { detail: payload }));
      }
    );
    
    // Subscribe to appointment_reminders table
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'appointment_reminders',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Realtime update received for appointment reminders:', payload);
        window.dispatchEvent(new CustomEvent('supabase-reminders-update', { detail: payload }));
      }
    );
    
    // Subscribe to commissions table
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'commissions',
      },
      (payload) => {
        console.log('Realtime update received for commissions:', payload);
        window.dispatchEvent(new CustomEvent('supabase-commissions-update', { detail: payload }));
      }
    );
    
    // Subscribe the channel
    channel.subscribe((status) => {
      console.log('Realtime subscription status:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to all tables!');
        window.dispatchEvent(new CustomEvent('supabase-realtime-connected'));
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Error connecting to realtime channel');
        window.dispatchEvent(new CustomEvent('supabase-realtime-error'));
      } else if (status === 'TIMED_OUT') {
        console.error('Realtime subscription timed out');
        window.dispatchEvent(new CustomEvent('supabase-realtime-timeout'));
      }
    });
    
    return channel;
  } catch (error) {
    console.error('Error initializing realtime subscriptions:', error);
    return null;
  }
};
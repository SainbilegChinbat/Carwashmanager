import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, initializeRealtimeSubscriptions } from '../utils/supabaseClient';
import { isSupabaseConfigured } from '../utils/supabaseClient'; 
import { getServices, getEmployees, getTransactions, getPendingServices, getAppointments, getActiveReminders, getServiceCategories } from '../utils/dataUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: { email: string; password: string; businessName: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (userData: any) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);

  // Function to force refresh all data
  const refreshAllData = async () => {
    if (user) {
      console.log('Forcing refresh of all data for user:', user.id);
      try {
        // Fetch all data types
        const services = await getServices(user.id);
        const employees = await getEmployees(user.id);
        const transactions = await getTransactions(user.id);
        const pendingServices = await getPendingServices(user.id);
        const appointments = await getAppointments(user.id);
        const reminders = await getActiveReminders(user.id);
        const categories = await getServiceCategories(user.id);
        
        // Dispatch events for each data type
        window.dispatchEvent(new CustomEvent('data-refreshed', { 
          detail: { 
            services,
            employees,
            transactions,
            pendingServices,
            appointments,
            reminders,
            categories,
            timestamp: new Date().toISOString()
          } 
        }));
        
        // Increment the refresh trigger to force component re-renders
        setDataRefreshTrigger(prev => prev + 1);
        
        console.log('All data refreshed successfully');
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    }
  };

  const clearAuthData = () => {
    console.log('Clearing auth data');
    setUser(null);
    setSession(null);
    
    // Clean up realtime channel if it exists
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      setRealtimeChannel(null);
    }
    
    // Clear any stored auth data
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('supabase.auth.token');
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // Skip Supabase auth if not configured
        if (!isSupabaseConfigured) {
          console.log('Supabase not configured, skipping auth initialization');
          setLoading(false);
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // If there's an error getting the session, clear any stale data
          if (error.message.includes('refresh_token_not_found') || 
              error.message.includes('Invalid Refresh Token')) {
            clearAuthData();
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Unexpected error getting session:', error);
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    let subscription;
    
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session);
          
          if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            if (event === 'SIGNED_OUT') {
              clearAuthData();
            } else {
              setSession(session);
              setUser(session?.user ?? null);
            }
          } else if (event === 'SIGNED_IN') {
            setSession(session);
            setUser(session?.user ?? null);
            
            // Initialize realtime subscriptions when user signs in
            if (session?.user) {
              if (isSupabaseConfigured) {
                const channel = initializeRealtimeSubscriptions(session.user.id);
                setRealtimeChannel(channel);
                
                // Set up event listeners for realtime updates
                const handleRealtimeUpdate = () => {
                  console.log('Realtime update received, refreshing all data');
                  refreshAllData();
                };
                
                window.addEventListener('supabase-services-update', handleRealtimeUpdate);
                window.addEventListener('supabase-employees-update', handleRealtimeUpdate);
                window.addEventListener('supabase-transactions-update', handleRealtimeUpdate);
                window.addEventListener('supabase-pending-services-update', handleRealtimeUpdate);
                window.addEventListener('supabase-appointments-update', handleRealtimeUpdate);
                window.addEventListener('supabase-reminders-update', handleRealtimeUpdate);
                window.addEventListener('supabase-commissions-update', handleRealtimeUpdate);
              }
              
              // Initial data fetch regardless of Supabase configuration
              refreshAllData();
            }
          } else if (event === 'USER_UPDATED') {
            setUser(session?.user ?? null);
          }
          
          setLoading(false);
        }
      );
      
      subscription = data.subscription;
    } else {
      setLoading(false);
    }

    // Handle auth errors globally
    const handleAuthError = (error: any) => {
      if (error?.message?.includes('refresh_token_not_found') || 
          error?.message?.includes('Invalid Refresh Token')) {
        console.warn('Invalid refresh token detected, clearing auth data');
        clearAuthData();
      }
    };

    // Listen for unhandled auth errors
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('refresh_token_not_found') ||
          event.reason?.message?.includes('Invalid Refresh Token') ||
          event.reason?.message?.includes('session_not_found')) {
        handleAuthError(event.reason);
        event.preventDefault(); // Prevent the error from being logged to console
      }
    });

    return () => {
      // Clean up realtime channel and event listeners on unmount
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
      }
      
      // Remove all event listeners
      window.removeEventListener('supabase-services-update', refreshAllData);
      window.removeEventListener('supabase-employees-update', refreshAllData);
      window.removeEventListener('supabase-transactions-update', refreshAllData);
      window.removeEventListener('supabase-pending-services-update', refreshAllData);
      window.removeEventListener('supabase-appointments-update', refreshAllData);
      window.removeEventListener('supabase-reminders-update', refreshAllData);
      window.removeEventListener('supabase-commissions-update', refreshAllData);
      
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // If Supabase is not configured, use local storage auth
      if (!isSupabaseConfigured) {
        console.log('Using local storage auth for login');
        // This will use the local storage implementation
        return { success: true };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Login exception:', error);
      return { success: false, error: 'Алдаа гарлаа. Дахин оролдоно уу.' };
    }
  };

  const register = async (userData: { email: string; password: string; businessName: string }): Promise<boolean> => {
    try {
      // If Supabase is not configured, use local storage auth
      if (!isSupabaseConfigured) {
        console.log('Using local storage auth for registration');
        // This will use the local storage implementation
        return true;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            businessName: userData.businessName, // Use camelCase to match trigger function
          },
        },
      });

      if (error) {
        console.error('Registration error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Registration exception:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          // Check if the error is related to missing or invalid session
          if (error.message?.includes('session_not_found') || 
              error.message?.includes('Session from session_id claim in JWT does not exist') ||
              error.message?.includes('Auth session missing')) {
            console.warn('Session already invalidated on server:', error.message);
          } else {
            console.error('Error signing out:', error);
          }
        }
      }
      clearAuthData();
    } catch (error) {
      // Check if the caught error is also related to session issues
      if (error?.message?.includes('session_not_found') || 
          error?.message?.includes('Session from session_id claim in JWT does not exist') ||
          error?.message?.includes('Auth session missing')) {
        console.warn('Session already invalidated on server:', error.message);
      } else {
        console.error('Unexpected error signing out:', error);
      }
      clearAuthData();
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      // If Supabase is not configured, use local storage auth
      if (!isSupabaseConfigured) {
        console.log('Using local storage auth for password reset');
        // This will use the local storage implementation
        return true;
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Reset password error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Reset password exception:', error);
      return false;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // If Supabase is not configured, use local storage auth
      if (!isSupabaseConfigured) {
        console.log('Using local storage auth for password change');
        // This will use the local storage implementation
        return { success: true };
      }
      
      // First verify the old password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: oldPassword,
      });

      if (verifyError) {
        return { success: false, error: 'Хуучин нууц үг буруу байна' };
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Алдаа гарлаа. Дахин оролдоно уу.' };
    }
  };

  const updateProfile = async (userData: any): Promise<boolean> => {
    try {
      // This would update the user profile in the users table
      // For now, just return true as the actual implementation would depend on your backend
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  const value = {
    user,
    session,
    loading: loading || dataRefreshTrigger === 0, // Consider loading until first data refresh
    login,
    register,
    logout,
    resetPassword,
    changePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
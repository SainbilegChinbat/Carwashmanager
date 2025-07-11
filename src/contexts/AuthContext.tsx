import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, initializeRealtimeSubscriptions } from '../utils/supabaseClient';
import { isSupabaseConfigured } from '../utils/supabaseClient';

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
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null);

  const clearAuthData = () => {
    console.log('Clearing auth data');
    setUser(null);
    setSession(null);
    
    // Clean up realtime subscription if it exists
    if (realtimeSubscription) {
      realtimeSubscription.unsubscribe();
      setRealtimeSubscription(null);
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
            if (session?.user && isSupabaseConfigured) {
              const subscription = initializeRealtimeSubscriptions(session.user.id);
              setRealtimeSubscription(subscription);
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
          event.reason?.message?.includes('Invalid Refresh Token')) {
        handleAuthError(event.reason);
        event.preventDefault(); // Prevent the error from being logged to console
      }
    });

    return () => {
      // Clean up realtime subscription on unmount
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }
      
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
          console.error('Error signing out:', error);
        }
      }
      clearAuthData();
    } catch (error) {
      console.error('Unexpected error signing out:', error);
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
    loading,
    login,
    register,
    logout,
    resetPassword,
    changePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
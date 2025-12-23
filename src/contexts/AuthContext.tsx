import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase/config';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: 'client' | 'photographer' | 'admin';
  phone?: string;
  created_at: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const register = async (email: string, password: string, name: string, role: string = 'client') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
        },
      },
    });
    if (error) throw error;

    // Create profile if user was created
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email || email,
          display_name: name,
          role: role,
        });
      if (profileError) console.error('Profile creation error:', profileError);
    }
  };

  const logout = async () => {
    try {
      // Clear user state first for immediate UI update
      setCurrentUser(null);
      setUserProfile(null);
      
      // Sign out from Supabase (this will trigger onAuthStateChange)
      const { error } = await supabase.auth.signOut();
      if (error) {
        // If signOut fails, restore state (unlikely but handle it)
        console.error('Sign out error:', error);
        throw error;
      }
      
      // Ensure state is cleared (onAuthStateChange should handle this, but be explicit)
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const loadUserProfile = async (userId: string, userEmail?: string, userName?: string) => {
    try {
      console.log('Loading user profile for:', userId);
      
      // First, try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('Profile fetch result:', { existingProfile, fetchError });

      // If profile doesn't exist, create it
      if (fetchError || !existingProfile) {
        console.log('Profile does not exist, creating new profile...');
        
        // Get user info from auth if not provided
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user:', userError);
          return;
        }
        
        if (user) {
          const profileData = {
            id: userId,
            email: userEmail || user.email || '',
            display_name: userName || user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'client' as const,
          };

          console.log('Inserting profile:', profileData);

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError);
            console.error('Error details:', JSON.stringify(createError, null, 2));
            // Try to show error to user
            if (createError.code === '23505') {
              console.log('Profile already exists (duplicate key), fetching it...');
              // Profile might have been created by a trigger, try fetching again
              const { data: retryProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
              if (retryProfile) {
                setUserProfile(retryProfile as UserProfile);
              }
            }
            return;
          }

          if (newProfile) {
            console.log('Profile created successfully:', newProfile);
            setUserProfile(newProfile as UserProfile);
            return;
          }
        } else {
          console.error('No user found in auth');
        }
      } else {
        console.log('Profile exists:', existingProfile);
      }

      // Update email if it's different (for OAuth users)
      if (existingProfile && userEmail && existingProfile.email !== userEmail) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ email: userEmail })
          .eq('id', userId)
          .select()
          .single();

        if (!updateError && updatedProfile) {
          setUserProfile(updatedProfile as UserProfile);
          return;
        }
      }

      if (existingProfile) {
        setUserProfile(existingProfile as UserProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id || 'no user');
      
      if (event === 'SIGNED_OUT' || !session) {
        // Explicitly clear state on sign out
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      } else {
        setCurrentUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          // Ensure profile exists and is up to date
          await loadUserProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata?.display_name || session.user.user_metadata?.full_name
          );
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
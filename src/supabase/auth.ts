import { supabase } from './config';

// Helper function to create a user profile in Supabase
const createUserProfile = async (userId: string, userData: { name: string; email: string; provider: string }) => {
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userData.email,
          display_name: userData.name,
          role: 'client', // Default role
        });

      if (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
      console.log('User profile created successfully');
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, name: string) => {
  try {
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

    if (data.user) {
      // Create user profile
      await createUserProfile(data.user.id, { name, email, provider: 'email' });
    }

    return data.user;
  } catch (error: any) {
    console.error('Error signing up with email:', error);
    throw error;
  }
};

// Login with email and password
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data.user;
  } catch (error: any) {
    console.error('Error logging in with email:', error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) throw error;

    // Note: For OAuth, the profile creation will be handled by AuthContext
    // when the user returns from OAuth via onAuthStateChange
    return data;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error: any) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Get user profile
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    return null;
  }
};


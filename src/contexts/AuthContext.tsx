import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'client' | 'photographer' | 'admin';
  phone?: string;
  createdAt: Date;
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
    const result = await signInWithEmailAndPassword(auth, email, password);
    await loadUserProfile(result.user.uid);
  };

  const register = async (email: string, password: string, name: string, role: string = 'client') => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    
    const profile: UserProfile = {
      uid: result.user.uid,
      email,
      displayName: name,
      role: role as 'client' | 'photographer' | 'admin',
      createdAt: new Date()
    };

    await setDoc(doc(db, 'users', result.user.uid), profile);
    setUserProfile(profile);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const loadUserProfile = async (uid: string) => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      setUserProfile(docSnap.data() as UserProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
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
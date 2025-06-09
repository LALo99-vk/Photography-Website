import { auth, db } from './config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Helper function to create a user document in Firestore
const createUserDocument = async (uid: string, userData: { name: string; email: string; provider: string }) => {
  try {
    // Check if user document already exists
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', uid), {
        ...userData,
        createdAt: new Date().toISOString(),
        role: 'client' // Default role
      });
      console.log('User document created successfully');
    }
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error; // Propagate error to handle it in the UI
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    createUserDocument(user.uid, { name, email, provider: 'email' }); // Don't await
    return user;
  } catch (error: any) {
    console.error('Error signing up with email:', error);
    throw error;
  }
};

// Login with email and password
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Error logging in with email:', error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const userCredential = await signInWithPopup(auth, provider);
    const { user } = userCredential;
    createUserDocument(user.uid, { 
      name: user.displayName || 'Unknown', 
      email: user.email || '', 
      provider: 'google' 
    }); // Don't await
    return user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}; 
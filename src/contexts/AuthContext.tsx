import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Initialize core state if new user
      if (currentUser) {
        const userStateRef = doc(db, `users/${currentUser.uid}/appState/economy`);
        try {
          const userStateSnap = await getDoc(userStateRef);
          if (!userStateSnap.exists()) {
             // Provide a blank template
             await setDoc(userStateRef, {
                 balance: 0,
                 streakCount: 0,
                 savingsGoal: 100, // Or whatever default
                 lastProcessDate: new Date().toISOString()
             }, { merge: true });
          }
        } catch (e) {
          console.warn("Could not fetch user appState. If offline, writes will be queued.", e);
          // If offline and first time ever, we might not be able to read.
          // In a rigorous app, we'd handle offline initialization more carefully.
          // Note: Firestore handles offline writes fine, but offline reads of non-cached docs fail.
        }
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

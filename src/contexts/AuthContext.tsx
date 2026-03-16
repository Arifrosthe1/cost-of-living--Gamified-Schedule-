import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { migrateLocalDataToCloud } from '../lib/migrate';

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
      try {
          setUser(currentUser);
          
          // Initialize core state & migrate if new user
          if (currentUser) {
            
            // Trigger migration (if it hasn't happened yet)
            await migrateLocalDataToCloud(currentUser.uid);

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
            }
          }
      } catch (err) {
          console.error("Auth Exception:", err);
      } finally {
          setLoading(false);
      }
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

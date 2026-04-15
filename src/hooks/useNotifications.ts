import { useState, useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging, db } from '../lib/firebase';
import { doc, arrayUnion, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>(
        'Notification' in window ? Notification.permission : 'default'
    );
    const { user } = useAuth();

    useEffect(() => {
        if (Notification.permission === 'granted') {
            registerToken(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const registerToken = async (isInitialSetup = false) => {
        if (!user) return;
        
        try {
            // Get the VAPID key from environment variables
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
            
            if (!vapidKey) {
                console.warn("VITE_FIREBASE_VAPID_KEY is missing. Cannot register for push notifications.");
                return;
            }

            let swRegistration = null;
            if ('serviceWorker' in navigator) {
                swRegistration = await navigator.serviceWorker.ready;
            }

            const currentToken = await getToken(messaging, { 
                vapidKey: vapidKey,
                serviceWorkerRegistration: swRegistration || undefined
            });

            if (currentToken) {
                // Save token to user's document in Firestore
                const userRef = doc(db, `users/${user.uid}`);
                await setDoc(userRef, {
                    fcmTokens: arrayUnion(currentToken)
                }, { merge: true });

                if (isInitialSetup && 'serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.ready;
                    if (registration.active) {
                        registration.active.postMessage({
                            type: 'INITIAL_SETUP_NOTIFICATION'
                        });
                    }
                }
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        } catch (err) {
            console.error('An error occurred while retrieving token. ', err);
        }
    };

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notification system.');
            return;
        }

        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);
        if (newPermission === 'granted') {
            registerToken(true);
        }
    };

    // Keep this stubbed out so other components don't break, 
    // but it's no longer needed since the server handles hazard logic.
    const cancelEveningWarning = async () => {};

    return {
        permission,
        requestPermission,
        cancelEveningWarning
    };
}

import { useState, useEffect } from 'react';

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>(
        'Notification' in window ? Notification.permission : 'default'
    );

    useEffect(() => {
        if (Notification.permission === 'granted') {
            scheduleNotifications(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notification system.');
            return;
        }

        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);
        if (newPermission === 'granted') {
            scheduleNotifications(true);
        }
    };

    const scheduleNotifications = async (isInitialSetup = false) => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'SCHEDULE_NOTIFICATIONS',
                        isInitialSetup
                    });
                }
            } catch (err) {
                console.warn("Failed getting SW ready state", err);
            }
        }
    };

    const cancelEveningWarning = async () => {
        if ('serviceWorker' in navigator && permission === 'granted') {
            try {
                const registration = await navigator.serviceWorker.ready;
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'CANCEL_EVENING_WARNING'
                    });
                }
            } catch (err) {
                console.warn("Failed to cancel evening SW notification", err);
            }
        }
    };

    return {
        permission,
        requestPermission,
        cancelEveningWarning
    };
}

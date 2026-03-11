import { useState, useEffect } from 'react';

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>(
        'Notification' in window ? Notification.permission : 'default'
    );

    useEffect(() => {
        if (permission === 'granted') {
            scheduleNotifications();
        }
    }, [permission]);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notification system.');
            return;
        }

        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);
        if (newPermission === 'granted') {
            scheduleNotifications();
        }
    };

    const scheduleNotifications = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'SCHEDULE_NOTIFICATIONS'
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

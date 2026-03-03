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

    const scheduleNotifications = () => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SCHEDULE_NOTIFICATIONS'
            });
        }
    };

    const cancelEveningWarning = () => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller && permission === 'granted') {
            navigator.serviceWorker.controller.postMessage({
                type: 'CANCEL_EVENING_WARNING'
            });
        }
    };

    const testNotification = () => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller && permission === 'granted') {
            navigator.serviceWorker.controller.postMessage({
                type: 'TEST_NOTIFICATION'
            });
        } else if (permission !== 'granted') {
            alert('Notification permission is not granted.');
        } else {
            alert('Service worker not ready.');
        }
    };

    return {
        permission,
        requestPermission,
        cancelEveningWarning,
        testNotification
    };
}

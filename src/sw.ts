/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
declare let self: ServiceWorkerGlobalScope & {
    registration: ServiceWorkerRegistration & {
        showTrigger?: any; // Origin trial API if available
    }
};

self.skipWaiting()
clientsClaim() // Taking control of all client tabs as soon as possible

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'INITIAL_SETUP_NOTIFICATION') {
        await self.registration.showNotification("Notifications Enabled! 🔔", {
            body: "You're all set! I'll remind you to keep your streak alive.",
            icon: '/pwa-192x192.png',
            tag: 'system-ready'
        });
    }
});

self.addEventListener('push', (event) => {
    let payload: any = { notification: { title: 'Notification', body: 'New alert!' } };
    if (event.data) {
        try {
            payload = event.data.json();
        } catch (e) {
            console.warn("Could not parse push data", e);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/pwa-192x192.png',
            tag: payload.notification.tag || 'default-push'
        })
    );
});

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

// Keep track of timeout handlers for fallback scheduling
let morningTimeout: any;
let eveningTimeout: any;

const EIGHT_AM = 8 * 60 * 60 * 1000; // 8:00 in ms
const EIGHT_PM = 20 * 60 * 60 * 1000; // 20:00 in ms

// Utility to calculate time until the next target hour
function getTimeUntilNext(targetHourMs: number): number {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetTime = target.getTime() + targetHourMs;

    // If target time has already passed today, schedule for tomorrow
    if (now.getTime() > targetTime) {
        return targetTime + (24 * 60 * 60 * 1000) - now.getTime();
    }
    return targetTime - now.getTime();
}

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATIONS') {
        scheduleNotifications(event.data.isInitialSetup);
    }
    if (event.data && event.data.type === 'CANCEL_EVENING_WARNING') {
        cancelEveningWarning();
    }
});

async function scheduleNotifications(isInitialSetup: boolean = false) {
    // Immediate proof of life ONLY on initial setup
    if (isInitialSetup) {
        await self.registration.showNotification("Notifications Enabled! 🔔", {
            body: "You're all set! I'll remind you in the morning and evening to keep your streak alive.",
            icon: '/pwa-192x192.png',
            tag: 'system-ready'
        });
    }

    // If browser supports Notification Triggers API
    if ('showTrigger' in self.registration && 'TimestampTrigger' in self) {
        try {
            // Schedule Morning Greeting
            const morningDelay = getTimeUntilNext(EIGHT_AM);
            await (self.registration as any).showNotification("🌅 Good Morning!", {
                body: "Start your day right! Log a quick Main or Side Quest to build your streak.",
                icon: '/pwa-192x192.png',
                tag: 'morning-greeting',
                showTrigger: new (self as any).TimestampTrigger(Date.now() + morningDelay)
            });

            // Schedule Evening Warning
            const eveningDelay = getTimeUntilNext(EIGHT_PM);
            await (self.registration as any).showNotification("⚠️ Your streak is at risk!", {
                body: "The RM5 Daily Tax hits at midnight. Complete a Side Quest now to build momentum!",
                icon: '/pwa-192x192.png',
                tag: 'evening-warning',
                showTrigger: new (self as any).TimestampTrigger(Date.now() + eveningDelay)
            });
            console.log("Successfully scheduled notifications using showTrigger API.");
            return;
        } catch (err) {
            console.warn("showTrigger failed, falling back to Service Worker timeouts.", err);
        }
    }

    // Fallback: If showTrigger is not supported (e.g., standard Desktop Chrome),
    // we use a best-effort setTimeout while the SW is alive.
    // Note: This relies on the SW being occasionally woken up by the browser.
    fallbackSchedule();
}

function fallbackSchedule() {
    clearTimeout(morningTimeout);
    clearTimeout(eveningTimeout);

    const morningDelay = getTimeUntilNext(EIGHT_AM);
    const eveningDelay = getTimeUntilNext(EIGHT_PM);

    morningTimeout = setTimeout(() => {
        self.registration.showNotification("🌅 Good Morning!", {
            body: "Start your day right! Log a quick Main or Side Quest to build your streak.",
            icon: '/pwa-192x192.png',
            tag: 'morning-greeting'
        });
        fallbackSchedule(); // Reschedule for next day
    }, morningDelay);

    eveningTimeout = setTimeout(() => {
        self.registration.showNotification("⚠️ Your streak is at risk!", {
            body: "The RM5 Daily Tax hits at midnight. Complete a Side Quest now to build momentum!",
            icon: '/pwa-192x192.png',
            tag: 'evening-warning'
        });
        fallbackSchedule(); // Reschedule for next day
    }, eveningDelay);
}

async function cancelEveningWarning() {
    // With showTrigger, we actually clear the existing scheduled notification by fetching it and closing it, 
    // or we just rely on updating the tag with a new time.
    // The easiest way to cancel a scheduled trigger is to fetch it and close it:
    try {
        const notifications = await self.registration.getNotifications({ tag: 'evening-warning' });
        notifications.forEach(notification => notification.close());
        console.log("Cancelled evening warning for today.");
    } catch (err) {
        console.error("Error cancelling evening warning:", err);
    }

    // Fallback cleanup
    if (eveningTimeout) {
        clearTimeout(eveningTimeout);
        // Reschedule for TOMORROW
        // Wait, if it's before 8pm, getTimeUntilNext(EIGHT_PM) gets today's 8pm. We want tomorrow's 8pm.
        const now = new Date();
        const target = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const eveningTime = target.getTime() + EIGHT_PM;
        const delay = (eveningTime > now.getTime() ? eveningTime + (24 * 60 * 60 * 1000) : eveningTime + (24 * 60 * 60 * 1000)) - now.getTime();

        eveningTimeout = setTimeout(() => {
            self.registration.showNotification("⚠️ Your streak is at risk!", {
                body: "The RM5 Daily Tax hits at midnight. Complete a Side Quest now to build momentum!",
                icon: '/pwa-192x192.png',
                tag: 'evening-warning'
            });
            fallbackSchedule();
        }, delay);
    }
}

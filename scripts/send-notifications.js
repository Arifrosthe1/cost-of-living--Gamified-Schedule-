import admin from 'firebase-admin';
import { differenceInDays, startOfDay } from 'date-fns';

// 1. Initialize Firebase Admin using Service Account JSON from env var
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable.");
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountKey);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();

// Parse args to see if it's morning or evening run
const isMorning = process.argv.includes('--morning');
const isEvening = process.argv.includes('--evening');

if (!isMorning && !isEvening) {
  console.error("Please specify --morning or --evening");
  process.exit(1);
}

async function run() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  if (snapshot.empty) {
    console.log('No users found.');
    return;
  }

  let sentCount = 0;

  for (const doc of snapshot.docs) {
    const userData = doc.data();
    const tokens = userData.fcmTokens || [];
    
    if (tokens.length === 0) continue; // Skip users without tokens

    const economyRef = db.doc(`users/${doc.id}/appState/economy`);
    const economySnap = await economyRef.get();
    
    if (!economySnap.exists) continue;
    const economyData = economySnap.data();
    
    let shouldSend = false;
    let notificationPayload = {};

    if (isMorning) {
      // Send to everyone with a token
      shouldSend = true;
      notificationPayload = {
        notification: {
          title: "🌅 Good Morning!",
          body: "Start your day right! Log a quick Main or Side Quest to build your streak.",
        }
      };
    } else if (isEvening) {
      // Check if they need a warning
      const lastPosStr = economyData.lastPositiveActionDate;
      const todayStr = new Date().toISOString().split('T')[0]; // Quick YYYY-MM-DD
      const streakCount = economyData.streakCount || 0;

      // If they haven't logged a positive action today
      if (lastPosStr !== todayStr) {
        shouldSend = true;
        let body = "The RM5 Daily Tax hits at midnight. Complete a Side Quest now to build momentum!";
        if (streakCount > 0) {
            body = `Your ${streakCount}-day streak is about to break! Complete a Side Quest before midnight!`;
        }

        notificationPayload = {
          notification: {
            title: "⚠️ Your streak is at risk!",
            body: body
          }
        };
      }
    }

    if (shouldSend) {
      try {
        const response = await messaging.sendEachForMulticast({
          tokens: tokens,
          notification: notificationPayload.notification
        });
        console.log(`Sent to ${doc.id}: ${response.successCount} success, ${response.failureCount} failed.`);
        sentCount += response.successCount;
      } catch (error) {
        console.error(`Error sending to user ${doc.id}:`, error);
      }
    }
  }

  console.log(`Job complete. Sent ${sentCount} notifications total.`);
}

run().catch(console.error);

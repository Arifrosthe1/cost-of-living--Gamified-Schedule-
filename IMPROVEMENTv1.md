# Cost of Living (Gamified Schedule) - Improvement Plan v1

This document outlines exciting ideas and potential features for the next major iteration of the Cost of Living application, moving beyond the offline-first cloud sync foundation.

## 1. Cloud-Powered Push Notifications (FCM)
Currently, notifications are handled by the local Service Worker, which requires the browser to be open or running in the background.
- **Idea**: Integrate **Firebase Cloud Messaging (FCM)**.
- **Benefit**: This allows a central server (or edge function) to ping the user's phone directly, even if the PWA is completely closed. We can send reliable "Evening Streak Warnings" or "Morning Summaries" mathematically calculated on the backend.

## 2. Advanced Data Visualization (Analytics Dashboard)
Now that data is safely stored in Firestore, we can create powerful visual insights.
- **Idea**: Add an "Analytics" or "Insights" tab using a lightweight charting library like Recharts or Chart.js.
- **Features**:
  - **Balance History Graph**: A line chart showing the user's wealth growth (or decline) over the last 30/90 days.
  - **Habit Consistency Matrix**: A GitHub-style contribution graph (green squares) showing daily activity.
  - **Spending vs. Earning Breakdown**: A visual split of where money goes (Taxes vs. Debt vs. User Rewards).

## 3. The "Stock Market" & Investments
Make the economy more dynamic and less linear.
- **Idea**: Allow users to lock away their RM into "Investments" or a "Savings Account" that earns a small daily interest rate, offsetting the daily tax.
- **Benefit**: Introduces long-term financial planning mechanics alongside short-term habit logging.

## 4. Multiplayer & Social Accountability
Since we have user authentication now, we can connect users.
- **Idea**: "Accountability Partnerships" or "Guilds".
- **Features**:
  - Add a friend via their user ID or email.
  - See a friend's current streak (but not their private balance).
  - "Co-op Quests": A shared goal where both users must complete a habit to earn a massive joint reward. Failure penalizes both.

## 5. Enhanced To-Do & Quest System
The current to-do system is highly functional but can be expanded.
- **Idea**: **Recurring Quests** and **Epic Milestones**.
- **Features**:
  - Weekly or Monthly habits (e.g., "Pay Rent" or "Deep Clean House").
  - "Epic Badges" for achieving huge milestones (e.g., reaching RM 1,000, 365-day streak) which are displayed permanently on the user's profile.

## 6. Native App Deployment (Capacitor/Tauri)
The PWA is great, but app store presence adds legitimacy and system-level APIs.
- **Idea**: Wrap the existing React + Vite codebase in **Capacitor** (for iOS/Android) or **Tauri** (for Windows/macOS desktop apps).
- **Benefit**: Access to native home screen widgets, native push notifications, and app store discoverability without rewriting the codebase.

## 7. Premium Tier / Monetization (Stripe)
If you intend to commercialize the app.
- **Idea**: Gate certain cosmetic or advanced features behind a "Pro" subscription.
- **Features**:
  - Custom themes and color palettes (e.g., strict Dark Mode).
  - Unlimited custom rewards (free tier limited to 5).
  - Access to advanced analytics graphs.

---
*Which of these directions would you like to explore first for the next update?*

# Cost of Living (Gamified Schedule) 🪙🎮

[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF.svg?style=flat-square&logo=vite)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.x-FFCA28.svg?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Cost of Living** is an accountability mirror disguised as a high-stakes economic simulation. Instead of a traditional "to-do" list, this mobile-first progressive web application (PWA) treats your time and habits like a financial ecosystem where **discipline is the only currency**. Deployed and running live at: **[costofliving.arifros.com](https://costofliving.arifros.com/)**

---

## 🌟 The Core Concept: Economic Productivity

The app operates on the philosophy that distractions aren't just "lost time"—they are expensive. The daily routine is gamified so that productivity is directly linked to virtual financial survival:

- 💰 **Earnings**: Completing productive habits and fulfilling "Daily Contracts" earns you Ringgit Malaysia (RM).
- 📉 **Costs**: Indulgences (like watching Netflix, playing games, or slacking off) carry a high virtual price tag, forcing you to "pay" to play.
- 💸 **The Daily Tax**: A flat **RM5 daily tax** is automatically deducted every morning. You cannot just coast; you must remain active and consistent to break even.

---

## ⚔️ Gamification Mechanics

### 1. Daily Contracts (To-Dos)
- **Mechanic**: Add commitments for **Today** or **Tomorrow**.
- **Reward**: Fulfilling a contract successfully awards **+RM15**.
- **Penalty**: If the day passes and a contract remains incomplete, it is marked as failed. You are penalized **-RM15** per failed contract.

### 2. Habits & Quests
- **Main Quests**: Central daily habits that keep you on track.
- **Side Quests**: Smaller, quick actions to boost your wallet.
- **Streak Multiplier**: Maintaining a streak of positive actions for 3+ consecutive days grants a **1.2x multiplier** bonus to all earnings.
- **Destiny Doubler (Dice Roll)**: Every 2 hours, roll the dice to randomly select an active Side Quest. If completed within the next 15 minutes, its reward is **doubled (2x)**.

### 3. The Reward Store & Gacha Mystery Box
- **Purchases**: Spend your earned RM on custom rewards or indulgence actions (e.g., watching a TV episode, cheat meal).
- **Tiers**: Rewards are classified into **Common**, **Rare**, and **Epic** tiers.
- **Safe Mystery Box**: Spend **RM99** to open a mystery box containing either a random common reward or a temporary powerhouse upgrade:
  - ✨ *Double Trouble (3x)*: Doubles the earnings of your next 3 habits.
  - 🤠 *Bounty Hunter*: Grants a flat **+RM50** bonus on your next Side Quest.
  - ⚡ *Main Quest Overdrive*: Doubles the earnings of your next Main Quest.

### 4. Compounding Debt & Bankruptcy (The Debt-Trap)
If you slack off and your balance falls below RM0, you enter a severe **Debt-Trap**:
- 🚨 **Compounding Interest**: Your debt grows at a staggering **25% daily interest rate**.
- 📉 **Snowball Effect**: If you remain in debt, it becomes mathematically difficult to recover, making consistency a survival necessity.
- ⚡ **Bankruptcy**: If your debt spirals to **-RM299** or deeper, you can declare bankruptcy. 
  - *The Catch*: This triggers a complete system wipe—deleting all habits, todos, rewards, and transaction history.
  - *The Penalty*: You start over with a fresh, flat **-RM100** penalty balance.
  - *Confirmation*: You must type `"I GIVE UP"` to confirm.

---

## 🛠️ Technical Architecture

This application was engineered with a mobile-first, offline-first perspective to guarantee reliability and performance:

- **Frontend Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/) for a lightning-fast runtime and full type safety.
- **Local Storage (Offline-First)**: Powered by [Dexie.js](https://dexie.org/) (wrapper for IndexedDB) to store habits, todos, and logs. The application runs completely offline (e.g., during commutes).
- **Cloud Sync**: Integrated with [Firebase Firestore](https://firebase.google.com/docs/firestore). Upon user authentication, a custom background migration protocol synchronizes local database states to Firestore and establishes real-time remote observers.
- **PWA Capabilities**: Leverages `vite-plugin-pwa` with custom service worker caching (`sw.ts`), allowing users to install the app onto mobile devices with native-app feel.
- **Push Notifications**: Employs Web Push API and Firebase Cloud Messaging (FCM) using a browser-ready VAPID configuration.

For an in-depth code review, see [ARCHITECTURE.md](file:///c:/Developer/a%20-%20Aremore%20Company%20%28codesource%29/cost-of-living%20%28Gamified%20Schedule%29/ARCHITECTURE.md).

---

## 📂 Project Structure

```bash
cost-of-living/
├── public/                 # Static assets (PWA icons, etc.)
├── src/
│   ├── components/         # Modular React components
│   │   ├── ActionList.tsx         # Quests & Habits UI + swipe controls + powerups
│   │   ├── AuthScreen.tsx         # Authentication logic wrapper
│   │   ├── BankruptcyButton.tsx   # Debt reset warning system & confirmation
│   │   ├── RewardStore.tsx        # Spending logs + Reward tiers + Gacha Mystery Box
│   │   ├── TodoList.tsx           # Daily contract scheduling
│   │   └── WalletDisplay.tsx      # Core economic telemetry & debt warning UI
│   ├── contexts/
│   │   └── AuthContext.tsx        # Firebase auth session provider & migration hook
│   ├── hooks/
│   │   ├── useEconomy.ts          # Core state hooks & economic simulator calculations
│   │   └── useNotifications.ts    # Web push & FCM notification token managers
│   ├── lib/
│   │   ├── firebase.ts            # Firestore and Auth configs
│   │   └── migrate.ts             # IndexedDB-to-Firestore bulk sync transaction logic
│   ├── store/
│   │   └── db.ts                  # Dexie.js database client setup & schemas
│   ├── App.tsx             # Application layout structure & React logic
│   ├── sw.ts               # Workbox service worker caching & notification listeners
│   └── main.tsx            # DOM initialization
├── index.html              # Landing Page entrypoint (served at root /)
├── app.html                # Main React App entrypoint (served at /app)
├── vercel.json             # Deployment settings (Clean URLs configuration)
```

---

## ⚡ Getting Started

### 📋 Prerequisites
- Node.js (v18+)
- npm or yarn
- A Firebase project setup with Firestore and Web Authentication enabled.

### ⚙️ Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Arifrosthe1/cost-of-living--Gamified-Schedule-.git
   cd cost-of-living--Gamified-Schedule-
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and populate it with your Firebase configuration and VAPID key:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_VAPID_KEY=your_vapid_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   - **Landing Page**: served locally at `http://localhost:5199/`
   - **Web Application**: served locally at `http://localhost:5199/app` (clean URL)

5. Build for production (compiles the PWA):
   ```bash
   npm run build
   ```

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
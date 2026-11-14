# FUN OFFLINE — Backend & Firestore Deployment Instructions

> **Honest Configuration Status**: Firebase provisioning was declined in the current AI Studio session. No live Firebase project, `google-services.json`, or deployed Cloud Functions endpoint is pre-configured.

## Prerequisites
1. Node.js 20+ and `firebase-tools` (`npm install -g firebase-tools`).
2. A Blaze-plan Firebase project (required for Cloud Functions v2) with **Firebase Authentication** (Email/Password and/or Google Sign-In) and **Cloud Firestore** enabled.

## Step-by-Step Deployment
1. Log into Firebase CLI:
   ```bash
   firebase login
   firebase use --add <YOUR_FIREBASE_PROJECT_ID>
   ```
2. Deploy Firestore security rules from the workspace root:
   ```bash
   firebase deploy --only firestore:rules
   ```
3. Build and deploy the trusted Cloud Functions:
   ```bash
   cd backend
   npm install
   npm run build
   firebase deploy --only functions
   ```
4. Bootstrap the first Admin account **server-side** (never via the mobile client):
   - Create the admin user in Firebase Console -> Authentication.
   - In Firestore Console, create document `/admins/<ADMIN_UID>` with `{ "active": true, "email": "<ADMIN_EMAIL>" }`.
   - Create an initial active referral document `/referrals/FUNSTART01` with `{ "code": "FUNSTART01", "ownerUid": "<ADMIN_UID>", "active": true, "redemptionCount": 0 }` so the first users can register with a valid referral code.
5. Seed `/games/{gameId}` (the exact 9 IDs: `level_devil`, `mini_militia`, `carrom`, `teen_patti`, `brick_block`, `pool`, `balloon_shooter`, `archery`, `ludo_star`) and `/packages/{packageId}` for bKash/Nagad/Rocket/Bank pricing.

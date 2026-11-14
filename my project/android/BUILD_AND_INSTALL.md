# FUN OFFLINE — Firebase Integration & Build Instructions

## Honest External Configuration Status
Because Firebase provisioning was declined in the AI Studio session and the container runs Node.js without Android SDK / JDK / Gradle installed:
1. `android/app/google-services.json` is **not** present (`google-services.json.template` is provided).
2. Firebase Cloud Functions (`backend/`) are **not** deployed to a live project yet.
3. Merchant accounts for **bKash, Nagad, Rocket, and Bank Transfer** are external and must be configured/verified manually by the Admin team.
4. APK compilation (`./gradlew assembleDebug` / `assembleRelease`) must be run locally in Android Studio or a machine with JDK 17 + Android SDK Platform 35.

## Setup Steps
1. Open the `/android` folder in **Android Studio Ladybug / Meerkat** or newer.
2. Create an Android app in Firebase Console with package name `com.funoffline.app`.
3. Download `google-services.json` and place it at `android/app/google-services.json`.
4. Deploy `firestore.rules` and `backend/` Cloud Functions (see `/backend/DEPLOYMENT.md`).
5. Run unit tests & build APK:
   ```bash
   cd android
   ./gradlew testDebugUnitTest
   ./gradlew assembleDebug
   ```
   Output APK: `android/app/build/outputs/apk/debug/app-debug.apk`

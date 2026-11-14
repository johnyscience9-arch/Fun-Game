export interface ProjectFileEntry {
  path: string;
  layer: 'Android Kotlin' | 'Gradle & Manifest' | 'Firebase & Security' | 'Backend Functions';
  summary: string;
  snippet: string;
}

export const PROJECT_FILES: readonly ProjectFileEntry[] = [
  {
    path: 'android/app/src/main/AndroidManifest.xml',
    layer: 'Gradle & Manifest',
    summary: 'Single-APK launcher MainActivity, optional camera/mic permissions with uses-feature required=false, and MediaSessionNoticeService foreground service.',
    snippet: `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.RECORD_AUDIO" />
  <uses-feature android:name="android.hardware.camera" android:required="false" />
  <uses-feature android:name="android.hardware.microphone" android:required="false" />

  <application android:name=".FunOfflineApp" android:allowBackup="false">
    <activity android:name=".MainActivity" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>
    <service
      android:name=".core.security.MediaSessionNoticeService"
      android:exported="false"
      android:foregroundServiceType="microphone|camera" />
  </application>
</manifest>`,
  },
  {
    path: 'android/app/build.gradle.kts',
    layer: 'Gradle & Manifest',
    summary: 'Single-APK Material 3 + Jetpack Compose setup, conditional google-services plugin, R8 minification & resource shrinking for 4GB RAM devices.',
    snippet: `if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}
android {
    namespace = "com.funoffline.app"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.funoffline.app"
        minSdk = 26
        targetSdk = 35
    }
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
        }
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/funoffline/app/ui/FunOfflineRoot.kt',
    layer: 'Android Kotlin',
    summary: 'Single-APK Compose router switching dynamically between AuthGate, PendingApproval, Suspended, AdminPortalShell, UserPortalShell, and OfflineGameViewport.',
    snippet: `Crossfade(targetState = Triple(session?.role, session?.accountStatus, state.offlinePracticeBypass)) { (role, status, offlineBypass) ->
    when {
        offlineBypass -> UserPortalShell(..., isOfflineOnlyMode = true)
        session == null || status == AccountStatus.UNREGISTERED -> AuthGateScreen(...)
        status == AccountStatus.PENDING_APPROVAL -> PendingApprovalScreen(...)
        status == AccountStatus.SUSPENDED -> SuspendedScreen(...)
        role == UserRole.ADMIN -> AdminPortalShell(...)
        else -> UserPortalShell(..., isOfflineOnlyMode = false)
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/funoffline/app/data/model/Models.kt',
    layer: 'Android Kotlin',
    summary: 'Strict 9-game GameId enum and MatchSession init guard forbidding 1v1 matches outside Carrom, Pool, and Ludo Star.',
    snippet: `enum class GameId(val wireId: String, val order: Int, val supports1v1Match: Boolean) {
    LEVEL_DEVIL("level_devil", 1, false),
    MINI_MILITIA("mini_militia", 2, false),
    CARROM("carrom", 3, true),
    TEEN_PATTI("teen_patti", 4, false),
    BRICK_BLOCK("brick_block", 5, false),
    POOL("pool", 6, true),
    BALLOON_SHOOTER("balloon_shooter", 7, false),
    ARCHERY("archery", 8, false),
    LUDO_STAR("ludo_star", 9, true);
}

data class MatchSession(..., val gameId: GameId) {
    init {
        require(gameId.supports1v1Match) {
            "1v1 matches are strictly limited to Carrom, Pool, and Ludo Star."
        }
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/funoffline/app/ui/user/games/NineGamesEngine.kt',
    layer: 'Android Kotlin',
    summary: 'Lightweight Compose Canvas game engines for all 9 original games tuned for low memory overhead on 4GB RAM Android phones.',
    snippet: `when (gameId) {
    GameId.LEVEL_DEVIL -> LevelDevilCanvas(...)
    GameId.MINI_MILITIA -> MiniMilitiaCanvas(...)
    GameId.CARROM -> CarromCanvas(...)
    GameId.TEEN_PATTI -> TeenPattiFreePlayTable(...) // Free Play Only
    GameId.BRICK_BLOCK -> BrickBlockCanvas(...)
    GameId.POOL -> PoolCanvas(...)
    GameId.BALLOON_SHOOTER -> BalloonShooterCanvas(...)
    GameId.ARCHERY -> ArcheryCanvas(...)
    GameId.LUDO_STAR -> LudoStarBoard(...)
}`,
  },
  {
    path: 'firestore.rules',
    layer: 'Firebase & Security',
    summary: 'Zero-trust Firestore rules: default-deny catch-all, server-only /admins/{uid} role verification, immutable coin ledger, split PII, and strict 1v1 gameId allowlist.',
    snippet: `function isAdmin() {
  return isSignedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
match /users/{userId} {
  allow get: if isValidId(userId) && (isOwner(userId) || isAdmin());
  allow list: if isAdmin();
  allow create, delete: if false;
  allow update: if isOwner(userId)
    && incoming().diff(existing()).affectedKeys().hasOnly(['preferredTheme', 'preferredLanguage', 'updatedAt'])
    && incoming().purchasedCoins == existing().purchasedCoins
    && incoming().role == existing().role;
}
match /matches/{matchId} {
  allow get: if isSignedIn() && existing().gameId in ['carrom', 'pool', 'ludo_star'];
}`,
  },
  {
    path: 'backend/src/index.ts',
    layer: 'Backend Functions',
    summary: 'Trusted Firebase Cloud Functions v2 for referral registration, server role check, admin approval/suspension, bKash/Nagad/Rocket/Bank review, and 1v1 match settlement.',
    snippet: `export const adminReviewPaymentOrder = onCall(async (request) => {
  const adminUid = await requireAdmin(request);
  // Runs inside Firestore transaction:
  // 1. Verifies status === 'PENDING'
  // 2. Updates status to APPROVED | REJECTED
  // 3. Atomically increments purchasedCoins & writes immutable /transactions ledger
});`,
  },
];

package com.funoffline.app

import android.app.Application
import com.google.firebase.FirebaseApp

class FunOfflineApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Safe initialization: if google-services.json was not added yet,
        // FirebaseApp.getApps(this) remains empty and the UI reports unconfigured status honestly.
        if (FirebaseApp.getApps(this).isEmpty()) {
            runCatching { FirebaseApp.initializeApp(this) }
        }
    }
}

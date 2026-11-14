package com.funoffline.app.core.security

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.funoffline.app.R

/**
 * Foreground notification service started ONLY after explicit per-session user consent
 * for microphone or camera usage during 1v1 lobby voice chat.
 * Guarantees visible Android privacy indicators + persistent notification and prevents covert recording.
 */
class MediaSessionNoticeService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return START_NOT_STICKY
        }

        val includeCamera = intent?.getBooleanExtra(EXTRA_CAMERA, false) == true
        val includeMic = intent?.getBooleanExtra(EXTRA_MIC, true) == true
        val notification = buildNotification(this, includeCamera, includeMic)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val fgsType = when {
                includeCamera && includeMic ->
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                includeCamera -> ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
                else -> ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            }
            startForeground(NOTIFICATION_ID, notification, fgsType)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        return START_NOT_STICKY
    }

    private fun buildNotification(
        context: Context,
        includeCamera: Boolean,
        includeMic: Boolean
    ): Notification {
        val manager = context.getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            CHANNEL_ID,
            context.getString(R.string.camera_mic_notice_channel),
            NotificationManager.IMPORTANCE_LOW
        )
        manager.createNotificationChannel(channel)

        val scopeLabel = buildList {
            if (includeMic) add("Microphone")
            if (includeCamera) add("Camera")
        }.joinToString(" + ")

        return NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle("FUN OFFLINE • $scopeLabel Active")
            .setContentText(context.getString(R.string.camera_mic_notice_text))
            .setOngoing(true)
            .build()
    }

    companion object {
        const val CHANNEL_ID = "fun_offline_media_privacy"
        const val NOTIFICATION_ID = 4091
        const val ACTION_START = "com.funoffline.app.MEDIA_START"
        const val ACTION_STOP = "com.funoffline.app.MEDIA_STOP"
        const val EXTRA_CAMERA = "extra_camera"
        const val EXTRA_MIC = "extra_mic"
    }
}

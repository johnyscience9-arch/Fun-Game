package com.funoffline.app.data.repository

import android.content.Context
import com.funoffline.app.data.model.*
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.functions.FirebaseFunctions
import kotlinx.coroutines.tasks.await

/**
 * Checks whether Firebase was configured via google-services.json.
 * Never fabricates fake credentials or simulated login sessions when Firebase is unconfigured.
 */
object FirebaseStatus {
    fun isConfigured(context: Context): Boolean = FirebaseApp.getApps(context).isNotEmpty()
}

class AuthAndSessionRepository(private val context: Context) {

    private fun authOrNull(): FirebaseAuth? =
        if (FirebaseStatus.isConfigured(context)) FirebaseAuth.getInstance() else null

    private fun dbOrNull(): FirebaseFirestore? =
        if (FirebaseStatus.isConfigured(context)) FirebaseFirestore.getInstance() else null

    private fun functionsOrNull(): FirebaseFunctions? =
        if (FirebaseStatus.isConfigured(context)) FirebaseFunctions.getInstance() else null

    suspend fun signInEmailPassword(email: String, password: String): Result<UserSessionProfile> {
        val auth = authOrNull() ?: return Result.failure(IllegalStateException("Firebase not configured (missing google-services.json)."))
        return runCatching {
            auth.signInWithEmailAndPassword(email.trim(), password).await()
            verifyServerSessionRole().getOrThrow()
        }
    }

    suspend fun createAuthAccountAndRegisterWithReferral(
        email: String,
        password: String,
        displayName: String,
        referralCode: String,
        phone: String
    ): Result<UserSessionProfile> {
        val auth = authOrNull() ?: return Result.failure(IllegalStateException("Firebase not configured (missing google-services.json)."))
        val functions = functionsOrNull() ?: return Result.failure(IllegalStateException("Firebase Functions unavailable."))
        return runCatching {
            auth.createUserWithEmailAndPassword(email.trim(), password).await()
            functions.getHttpsCallable("registerWithReferral").call(
                mapOf(
                    "displayName" to displayName.trim(),
                    "referralCodeInput" to referralCode.trim().uppercase(),
                    "phone" to phone.trim()
                )
            ).await()
            verifyServerSessionRole().getOrThrow()
        }
    }

    /**
     * Always verifies role and balances from server-side Cloud Function + Firestore;
     * never trusts client-side preferences or local storage for Admin access or Coins.
     */
    suspend fun verifyServerSessionRole(): Result<UserSessionProfile> {
        val auth = authOrNull() ?: return Result.failure(IllegalStateException("Firebase not configured."))
        val functions = functionsOrNull() ?: return Result.failure(IllegalStateException("Functions unavailable."))
        val db = dbOrNull() ?: return Result.failure(IllegalStateException("Firestore unavailable."))
        val currentUser = auth.currentUser ?: return Result.failure(IllegalStateException("Not signed in."))

        return runCatching {
            val res = functions.getHttpsCallable("verifySessionRole").call().await()
            @Suppress("UNCHECKED_CAST")
            val data = res.getData() as? Map<String, Any?> ?: emptyMap()
            val roleStr = (data["role"] as? String) ?: "USER"
            val statusStr = (data["accountStatus"] as? String) ?: "UNREGISTERED"
            val userSnap = db.collection("users").document(currentUser.uid).get().await()

            UserSessionProfile(
                uid = currentUser.uid,
                displayName = userSnap.getString("displayName") ?: currentUser.email.orEmpty(),
                email = currentUser.email.orEmpty(),
                referralCode = userSnap.getString("referralCode") ?: "",
                referredByCode = userSnap.getString("referredByCode") ?: "",
                role = if (roleStr == "ADMIN") UserRole.ADMIN else UserRole.USER,
                accountStatus = runCatching { AccountStatus.valueOf(statusStr) }.getOrDefault(AccountStatus.UNREGISTERED),
                purchasedCoins = (data["purchasedCoins"] as? Number)?.toLong() ?: 0L,
                practicePoints = (data["practicePoints"] as? Number)?.toLong() ?: 0L,
                premiumTier = (data["premiumTier"] as? String) ?: "FREE"
            )
        }
    }

    fun signOut() {
        authOrNull()?.signOut()
    }
}

class GamingPlatformRepository(private val context: Context) {

    private fun dbOrNull(): FirebaseFirestore? =
        if (FirebaseStatus.isConfigured(context)) FirebaseFirestore.getInstance() else null

    private fun functionsOrNull(): FirebaseFunctions? =
        if (FirebaseStatus.isConfigured(context)) FirebaseFunctions.getInstance() else null

    suspend fun fetchPackages(): Result<List<CoinPackage>> {
        val db = dbOrNull() ?: return Result.failure(IllegalStateException("Firebase not configured."))
        return runCatching {
            val snap = db.collection("packages").whereEqualTo("active", true).get().await()
            snap.documents.map { doc ->
                CoinPackage(
                    id = doc.id,
                    nameEn = doc.getString("nameEn") ?: "",
                    nameBn = doc.getString("nameBn") ?: "",
                    coinAmount = doc.getLong("coinAmount") ?: 0L,
                    priceBdt = doc.getLong("priceBdt") ?: 0L,
                    isMembership = doc.getBoolean("isMembership") == true,
                    membershipDays = (doc.getLong("membershipDays") ?: 0L).toInt(),
                    active = doc.getBoolean("active") == true
                )
            }
        }
    }

    suspend fun submitPaymentOrder(
        packageId: String,
        method: PaymentMethod,
        transactionId: String,
        senderLastFour: String
    ): Result<String> {
        val functions = functionsOrNull() ?: return Result.failure(IllegalStateException("Firebase not configured."))
        return runCatching {
            val res = functions.getHttpsCallable("submitPaymentOrder").call(
                mapOf(
                    "packageId" to packageId,
                    "method" to method.name,
                    "transactionId" to transactionId.trim(),
                    "senderLastFour" to senderLastFour.trim()
                )
            ).await()
            @Suppress("UNCHECKED_CAST")
            val data = res.getData() as? Map<String, Any?> ?: emptyMap()
            (data["paymentId"] as? String) ?: ""
        }
    }

    suspend fun fetchUserTransactions(uid: String): Result<List<CoinTransaction>> {
        val db = dbOrNull() ?: return Result.failure(IllegalStateException("Firebase not configured."))
        return runCatching {
            val snap = db.collection("transactions")
                .whereEqualTo("userId", uid)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .limit(50)
                .get()
                .await()
            snap.documents.map { d ->
                CoinTransaction(
                    id = d.id,
                    userId = d.getString("userId") ?: "",
                    bucket = runCatching { CurrencyBucket.valueOf(d.getString("bucket") ?: "") }
                        .getOrDefault(CurrencyBucket.PRACTICE_POINTS),
                    delta = d.getLong("delta") ?: 0L,
                    reason = d.getString("reason") ?: "",
                    referenceId = d.getString("referenceId") ?: ""
                )
            }
        }
    }

    suspend fun create1v1Match(gameId: GameId, practiceEntryPoints: Long): Result<String> {
        require(gameId.supports1v1Match) { "Only Carrom, Pool, and Ludo Star allow 1v1 matches." }
        val functions = functionsOrNull() ?: return Result.failure(IllegalStateException("Firebase not configured."))
        return runCatching {
            val res = functions.getHttpsCallable("createOrJoinMatch").call(
                mapOf("gameId" to gameId.wireId, "practiceEntryPoints" to practiceEntryPoints)
            ).await()
            @Suppress("UNCHECKED_CAST")
            ((res.getData() as? Map<*, *>)?.get("matchId") as? String) ?: ""
        }
    }

    suspend fun adminReviewPayment(paymentId: String, approve: Boolean, note: String): Result<Unit> {
        val functions = functionsOrNull() ?: return Result.failure(IllegalStateException("Firebase not configured."))
        return runCatching {
            functions.getHttpsCallable("adminReviewPaymentOrder").call(
                mapOf(
                    "paymentId" to paymentId,
                    "decision" to if (approve) "APPROVED" else "REJECTED",
                    "note" to note
                )
            ).await()
            Unit
        }
    }

    suspend fun adminUpdateUserStatus(targetUid: String, activate: Boolean, reason: String): Result<Unit> {
        val functions = functionsOrNull() ?: return Result.failure(IllegalStateException("Firebase not configured."))
        return runCatching {
            functions.getHttpsCallable("adminApproveOrSuspendUser").call(
                mapOf(
                    "targetUid" to targetUid,
                    "decision" to if (activate) "ACTIVE" else "SUSPENDED",
                    "reason" to reason
                )
            ).await()
            Unit
        }
    }
}

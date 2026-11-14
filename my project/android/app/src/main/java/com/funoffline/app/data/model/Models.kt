package com.funoffline.app.data.model

enum class GameId(
    val wireId: String,
    val order: Int,
    val titleEn: String,
    val titleBn: String,
    val genreEn: String,
    val genreBn: String,
    val supports1v1Match: Boolean,
    val freePlayOnlyNotice: String? = null
) {
    LEVEL_DEVIL("level_devil", 1, "Level Devil", "লেভেল ডেভিল", "Trap Platformer", "ট্র্যাপ প্ল্যাটফর্মার", false),
    MINI_MILITIA("mini_militia", 2, "Mini Militia", "মিনি মিলিশিয়া", "Lightweight Shooter", "হালকা শুটার", false),
    CARROM("carrom", 3, "Carrom", "ক্যারম", "Board & Striker", "বোর্ড ও স্ট্রাইকার", true),
    TEEN_PATTI("teen_patti", 4, "Teen Patti", "তিন পাত্তি", "Free Card Play", "ফ্রি কার্ড প্লে", false, "Free play only — no wagering"),
    BRICK_BLOCK("brick_block", 5, "Brick Block", "ব্রিক ব্লক", "Grid Puzzle", "গ্রিড পাজল", false),
    POOL("pool", 6, "Pool", "পুল", "Cue Sports", "কিউ স্পোর্টস", true),
    BALLOON_SHOOTER("balloon_shooter", 7, "Balloon Shooter", "বেলুন শুটার", "Arcade Reflex", "আর্কেড রিফ্লেক্স", false),
    ARCHERY("archery", 8, "Archery", "আর্চারি", "Skill Precision", "লক্ষ্যভেদ স্কিল", false),
    LUDO_STAR("ludo_star", 9, "Ludo Star", "লুডু স্টার", "Dice Board", "ডাইস বোর্ড", true);

    companion object {
        val ALL_NINE: List<GameId> = entries.sortedBy { it.order }
        val MATCH_ELIGIBLE: List<GameId> = ALL_NINE.filter { it.supports1v1Match }
    }
}

enum class UserRole { USER, ADMIN }
enum class AccountStatus { UNREGISTERED, PENDING_APPROVAL, ACTIVE, SUSPENDED }
enum class CurrencyBucket { PURCHASED_COINS, PRACTICE_POINTS }
enum class PaymentMethod { BKASH, NAGAD, ROCKET, BANK_TRANSFER }
enum class PaymentStatus { PENDING, APPROVED, REJECTED }
enum class MatchStatus { WAITING_OPPONENT, AWAITING_ACCEPTANCE, ACTIVE, COMPLETED, FORFEIT_DISCONNECT, EXPIRED, CANCELLED }

data class UserSessionProfile(
    val uid: String = "",
    val displayName: String = "",
    val email: String = "",
    val referralCode: String = "",
    val referredByCode: String = "",
    val role: UserRole = UserRole.USER,
    val accountStatus: AccountStatus = AccountStatus.UNREGISTERED,
    val purchasedCoins: Long = 0L,
    val practicePoints: Long = 0L,
    val premiumTier: String = "FREE",
    val premiumExpiresAtMs: Long = 0L
)

data class CoinPackage(
    val id: String,
    val nameEn: String,
    val nameBn: String,
    val coinAmount: Long,
    val priceBdt: Long,
    val isMembership: Boolean,
    val membershipDays: Int = 0,
    val active: Boolean = true
)

data class PaymentSubmission(
    val id: String,
    val userId: String,
    val packageId: String,
    val method: PaymentMethod,
    val transactionId: String,
    val senderLastFour: String,
    val amountBdt: Long,
    val status: PaymentStatus,
    val reviewNote: String = ""
)

data class MatchSession(
    val id: String,
    val gameId: GameId,
    val hostUserId: String,
    val guestUserId: String? = null,
    val hostAccepted: Boolean = true,
    val guestAccepted: Boolean = false,
    val practiceEntryPoints: Long = 50L,
    val durationSeconds: Int = 300,
    val status: MatchStatus = MatchStatus.WAITING_OPPONENT,
    val winnerUserId: String? = null
) {
    init {
        require(gameId.supports1v1Match) {
            "1v1 matches are strictly limited to Carrom, Pool, and Ludo Star."
        }
    }
}

data class CoinTransaction(
    val id: String,
    val userId: String,
    val bucket: CurrencyBucket,
    val delta: Long,
    val reason: String,
    val referenceId: String
)

data class DailyTask(
    val id: String,
    val titleEn: String,
    val titleBn: String,
    val rewardPracticePoints: Long,
    val completed: Boolean
)

data class StoreItem(
    val id: String,
    val gameId: GameId,
    val nameEn: String,
    val nameBn: String,
    val priceBucket: CurrencyBucket,
    val priceAmount: Long,
    val owned: Boolean
)

data class AppNotification(
    val id: String,
    val title: String,
    val body: String,
    val targetUid: String
)

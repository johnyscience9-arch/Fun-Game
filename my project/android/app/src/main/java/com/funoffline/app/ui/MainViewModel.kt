package com.funoffline.app.ui

import android.app.Application
import android.content.Intent
import androidx.core.content.ContextCompat
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.funoffline.app.core.i18n.AppLanguage
import com.funoffline.app.core.security.MediaSessionNoticeService
import com.funoffline.app.core.theme.AppThemeMode
import com.funoffline.app.data.model.*
import com.funoffline.app.data.repository.AuthAndSessionRepository
import com.funoffline.app.data.repository.FirebaseStatus
import com.funoffline.app.data.repository.GamingPlatformRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MainUiState(
    val firebaseConfigured: Boolean = false,
    val themeMode: AppThemeMode = AppThemeMode.AMOLED,
    val language: AppLanguage = AppLanguage.EN,
    val session: UserSessionProfile? = null,
    val offlinePracticeBypass: Boolean = false,
    val activeGame: GameId? = null,
    val packages: List<CoinPackage> = emptyList(),
    val transactions: List<CoinTransaction> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val statusMessage: String? = null,
    val micConsentActive: Boolean = false,
    val cameraConsentActive: Boolean = false
)

class MainViewModel(application: Application) : AndroidViewModel(application) {
    private val authRepo = AuthAndSessionRepository(application)
    private val platformRepo = GamingPlatformRepository(application)

    private val _uiState = MutableStateFlow(
        MainUiState(firebaseConfigured = FirebaseStatus.isConfigured(application))
    )
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    init {
        if (_uiState.value.firebaseConfigured) {
            refreshSession()
        }
    }

    fun setThemeMode(mode: AppThemeMode) {
        _uiState.update { it.copy(themeMode = mode) }
    }

    fun toggleLanguage() {
        _uiState.update {
            it.copy(language = if (it.language == AppLanguage.EN) AppLanguage.BN else AppLanguage.EN)
        }
    }

    fun enterOfflineFreePractice() {
        _uiState.update { it.copy(offlinePracticeBypass = true, errorMessage = null) }
    }

    fun exitOfflineFreePractice() {
        _uiState.update { it.copy(offlinePracticeBypass = false, activeGame = null) }
    }

    fun launchGame(gameId: GameId) {
        _uiState.update { it.copy(activeGame = gameId) }
    }

    fun closeGame() {
        _uiState.update { it.copy(activeGame = null) }
    }

    fun signIn(email: String, password: String) {
        if (email.isBlank() || password.length < 6) {
            _uiState.update { it.copy(errorMessage = "Enter a valid email and 6+ character password.") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            authRepo.signInEmailPassword(email, password)
                .onSuccess { profile ->
                    _uiState.update { it.copy(isLoading = false, session = profile) }
                    loadUserPlatformData(profile.uid)
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = err.message) }
                }
        }
    }

    fun registerWithReferral(
        email: String,
        password: String,
        displayName: String,
        referralCode: String,
        phone: String
    ) {
        if (referralCode.trim().length < 6) {
            _uiState.update { it.copy(errorMessage = "A valid referral code is required.") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            authRepo.createAuthAccountAndRegisterWithReferral(
                email, password, displayName, referralCode, phone
            ).onSuccess { profile ->
                _uiState.update { it.copy(isLoading = false, session = profile) }
            }.onFailure { err ->
                _uiState.update { it.copy(isLoading = false, errorMessage = err.message) }
            }
        }
    }

    fun refreshSession() {
        viewModelScope.launch {
            authRepo.verifyServerSessionRole()
                .onSuccess { profile ->
                    _uiState.update { it.copy(session = profile) }
                    if (profile.accountStatus == AccountStatus.ACTIVE) {
                        loadUserPlatformData(profile.uid)
                    }
                }
        }
    }

    private fun loadUserPlatformData(uid: String) {
        viewModelScope.launch {
            val pkgs = platformRepo.fetchPackages().getOrDefault(emptyList())
            val txs = platformRepo.fetchUserTransactions(uid).getOrDefault(emptyList())
            _uiState.update { it.copy(packages = pkgs, transactions = txs) }
        }
    }

    fun submitPayment(
        packageId: String,
        method: PaymentMethod,
        txId: String,
        senderLastFour: String
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null, statusMessage = null) }
            platformRepo.submitPaymentOrder(packageId, method, txId, senderLastFour)
                .onSuccess { paymentId ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            statusMessage = "Payment $paymentId submitted for admin verification (PENDING)."
                        )
                    }
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = err.message) }
                }
        }
    }

    fun create1v1Match(gameId: GameId, entryPoints: Long) {
        if (!gameId.supports1v1Match) {
            _uiState.update { it.copy(errorMessage = "1v1 matches are allowed only for Carrom, Pool, and Ludo Star.") }
            return
        }
        viewModelScope.launch {
            platformRepo.create1v1Match(gameId, entryPoints)
                .onSuccess { id ->
                    _uiState.update { it.copy(statusMessage = "1v1 match lobby $id created (Practice Points).") }
                }
                .onFailure { err ->
                    _uiState.update { it.copy(errorMessage = err.message) }
                }
        }
    }

    fun setExplicitMediaConsent(mic: Boolean, camera: Boolean) {
        val ctx = getApplication<Application>()
        val intent = Intent(ctx, MediaSessionNoticeService::class.java)
        if (mic || camera) {
            intent.action = MediaSessionNoticeService.ACTION_START
            intent.putExtra(MediaSessionNoticeService.EXTRA_MIC, mic)
            intent.putExtra(MediaSessionNoticeService.EXTRA_CAMERA, camera)
            ContextCompat.startForegroundService(ctx, intent)
        } else {
            intent.action = MediaSessionNoticeService.ACTION_STOP
            ctx.startService(intent)
        }
        _uiState.update { it.copy(micConsentActive = mic, cameraConsentActive = camera) }
    }

    fun signOut() {
        setExplicitMediaConsent(mic = false, camera = false)
        authRepo.signOut()
        _uiState.update { it.copy(session = null, offlinePracticeBypass = false, activeGame = null) }
    }
}

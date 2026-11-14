package com.funoffline.app.ui

import androidx.compose.animation.Crossfade
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.funoffline.app.core.i18n.stringsFor
import com.funoffline.app.core.theme.FunOfflineTheme
import com.funoffline.app.data.model.AccountStatus
import com.funoffline.app.data.model.UserRole
import com.funoffline.app.ui.admin.AdminPortalShell
import com.funoffline.app.ui.auth.AuthGateScreen
import com.funoffline.app.ui.auth.PendingApprovalScreen
import com.funoffline.app.ui.auth.SuspendedScreen
import com.funoffline.app.ui.user.UserPortalShell
import com.funoffline.app.ui.user.games.OfflineGameViewport

@Composable
fun FunOfflineRoot(viewModel: MainViewModel) {
    val state by viewModel.uiState.collectAsState()
    val strings = stringsFor(state.language)

    FunOfflineTheme(mode = state.themeMode) {
        val activeGame = state.activeGame
        if (activeGame != null) {
            OfflineGameViewport(
                gameId = activeGame,
                language = state.language,
                onExit = viewModel::closeGame
            )
            return@FunOfflineTheme
        }

        val session = state.session
        Crossfade(targetState = Triple(session?.role, session?.accountStatus, state.offlinePracticeBypass), label = "rootRoute") { (role, status, offlineBypass) ->
            when {
                offlineBypass -> UserPortalShell(
                    state = state,
                    strings = strings,
                    isOfflineOnlyMode = true,
                    onLaunchGame = viewModel::launchGame,
                    onToggleLanguage = viewModel::toggleLanguage,
                    onThemeChange = viewModel::setThemeMode,
                    onSubmitPayment = viewModel::submitPayment,
                    onCreateMatch = viewModel::create1v1Match,
                    onConsentChange = viewModel::setExplicitMediaConsent,
                    onSignOut = viewModel::exitOfflineFreePractice
                )

                session == null || status == AccountStatus.UNREGISTERED -> AuthGateScreen(
                    state = state,
                    strings = strings,
                    onSignIn = viewModel::signIn,
                    onRegister = viewModel::registerWithReferral,
                    onToggleLanguage = viewModel::toggleLanguage,
                    onThemeChange = viewModel::setThemeMode,
                    onEnterOfflinePractice = viewModel::enterOfflineFreePractice
                )

                status == AccountStatus.PENDING_APPROVAL -> PendingApprovalScreen(
                    strings = strings,
                    onRefresh = viewModel::refreshSession,
                    onEnterOfflinePractice = viewModel::enterOfflineFreePractice,
                    onSignOut = viewModel::signOut
                )

                status == AccountStatus.SUSPENDED -> SuspendedScreen(
                    strings = strings,
                    onSignOut = viewModel::signOut
                )

                // Single APK, server-verified role separation: Admin vs User
                role == UserRole.ADMIN -> AdminPortalShell(
                    state = state,
                    strings = strings,
                    onToggleLanguage = viewModel::toggleLanguage,
                    onThemeChange = viewModel::setThemeMode,
                    onSignOut = viewModel::signOut
                )

                else -> UserPortalShell(
                    state = state,
                    strings = strings,
                    isOfflineOnlyMode = false,
                    onLaunchGame = viewModel::launchGame,
                    onToggleLanguage = viewModel::toggleLanguage,
                    onThemeChange = viewModel::setThemeMode,
                    onSubmitPayment = viewModel::submitPayment,
                    onCreateMatch = viewModel::create1v1Match,
                    onConsentChange = viewModel::setExplicitMediaConsent,
                    onSignOut = viewModel::signOut
                )
            }
        }
    }
}

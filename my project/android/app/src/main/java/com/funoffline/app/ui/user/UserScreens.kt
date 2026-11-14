package com.funoffline.app.ui.user

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.funoffline.app.core.i18n.AppLanguage
import com.funoffline.app.core.i18n.AppStrings
import com.funoffline.app.core.theme.AppThemeMode
import com.funoffline.app.data.model.*
import com.funoffline.app.ui.MainUiState

private enum class UserTab { HOME, GAMES, MATCHES, WALLET, PROFILE }

@Composable
fun UserPortalShell(
    state: MainUiState,
    strings: AppStrings,
    isOfflineOnlyMode: Boolean,
    onLaunchGame: (GameId) -> Unit,
    onToggleLanguage: () -> Unit,
    onThemeChange: (AppThemeMode) -> Unit,
    onSubmitPayment: (String, PaymentMethod, String, String) -> Unit,
    onCreateMatch: (GameId, Long) -> Unit,
    onConsentChange: (Boolean, Boolean) -> Unit,
    onSignOut: () -> Unit
) {
    var currentTab by remember { mutableStateOf(UserTab.HOME) }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                NavigationBarItem(
                    selected = currentTab == UserTab.HOME,
                    onClick = { currentTab = UserTab.HOME },
                    icon = { Icon(Icons.Default.Home, contentDescription = strings.home) },
                    label = { Text(strings.home) }
                )
                NavigationBarItem(
                    selected = currentTab == UserTab.GAMES,
                    onClick = { currentTab = UserTab.GAMES },
                    icon = { Icon(Icons.Default.SportsEsports, contentDescription = strings.games) },
                    label = { Text(strings.games) }
                )
                NavigationBarItem(
                    selected = currentTab == UserTab.MATCHES,
                    onClick = { currentTab = UserTab.MATCHES },
                    icon = { Icon(Icons.Default.Groups, contentDescription = strings.matches) },
                    label = { Text(strings.matches) }
                )
                NavigationBarItem(
                    selected = currentTab == UserTab.WALLET,
                    onClick = { currentTab = UserTab.WALLET },
                    icon = { Icon(Icons.Default.AccountBalanceWallet, contentDescription = strings.wallet) },
                    label = { Text(strings.wallet) }
                )
                NavigationBarItem(
                    selected = currentTab == UserTab.PROFILE,
                    onClick = { currentTab = UserTab.PROFILE },
                    icon = { Icon(Icons.Default.Person, contentDescription = strings.profile) },
                    label = { Text(strings.profile) }
                )
            }
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when (currentTab) {
                UserTab.HOME -> UserHomeTab(state, strings, isOfflineOnlyMode, onLaunchGame) { currentTab = UserTab.GAMES }
                UserTab.GAMES -> NineGamesLibraryTab(state.language, strings, onLaunchGame)
                UserTab.MATCHES -> Match1v1Tab(state, strings, isOfflineOnlyMode, onCreateMatch)
                UserTab.WALLET -> WalletAndPurchaseTab(state, strings, isOfflineOnlyMode, onSubmitPayment)
                UserTab.PROFILE -> ProfileAndConsentTab(state, strings, onToggleLanguage, onThemeChange, onConsentChange, onSignOut)
            }
        }
    }
}

@Composable
private fun UserHomeTab(
    state: MainUiState,
    strings: AppStrings,
    isOfflineOnlyMode: Boolean,
    onLaunchGame: (GameId) -> Unit,
    onBrowseAllGames: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(strings.appName, style = MaterialTheme.typography.headlineLarge)
            Text(
                if (isOfflineOnlyMode) "Offline Free Practice Mode • 9 Original Games"
                else "Verified Player: ${state.session?.displayName.orEmpty()}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Card(modifier = Modifier.weight(1f)) {
                    Column(Modifier.padding(14.dp)) {
                        Text(strings.purchasedCoins, style = MaterialTheme.typography.labelMedium)
                        Text("${state.session?.purchasedCoins ?: 0}", style = MaterialTheme.typography.headlineMedium)
                    }
                }
                Card(modifier = Modifier.weight(1f)) {
                    Column(Modifier.padding(14.dp)) {
                        Text(strings.practicePoints, style = MaterialTheme.typography.labelMedium)
                        Text("${state.session?.practicePoints ?: 0}", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }
        item {
            Button(onClick = onBrowseAllGames, modifier = Modifier.fillMaxWidth().height(50.dp)) {
                Text("${strings.games} — ${strings.freePlay}")
            }
        }
        item {
            Text(strings.matchEligibilityNote, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        items(GameId.MATCH_ELIGIBLE) { game ->
            Card {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(if (state.language == AppLanguage.BN) game.titleBn else game.titleEn, style = MaterialTheme.typography.titleMedium)
                        Text("Offline Practice + 1v1 Friendly Match", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    FilledTonalButton(onClick = { onLaunchGame(game) }) {
                        Text(strings.freePlay)
                    }
                }
            }
        }
    }
}

@Composable
private fun NineGamesLibraryTab(
    language: AppLanguage,
    strings: AppStrings,
    onLaunchGame: (GameId) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Text(strings.games, style = MaterialTheme.typography.headlineMedium)
            Text(strings.matchEligibilityNote, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        items(GameId.ALL_NINE) { game ->
            Card {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("${game.order}. ${if (language == AppLanguage.BN) game.titleBn else game.titleEn}", style = MaterialTheme.typography.titleMedium)
                        Text(
                            buildString {
                                append(if (language == AppLanguage.BN) game.genreBn else game.genreEn)
                                if (game.supports1v1Match) append(" • 1v1 Enabled")
                                game.freePlayOnlyNotice?.let { append(" • $it") }
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Button(onClick = { onLaunchGame(game) }) {
                        Text(strings.freePlay)
                    }
                }
            }
        }
    }
}

@Composable
private fun Match1v1Tab(
    state: MainUiState,
    strings: AppStrings,
    isOfflineOnlyMode: Boolean,
    onCreateMatch: (GameId, Long) -> Unit
) {
    var selectedGame by remember { mutableStateOf(GameId.CARROM) }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(strings.match1v1, style = MaterialTheme.typography.headlineMedium)
            Text(strings.matchEligibilityNote, style = MaterialTheme.typography.bodyMedium)
            Text("Friendly 1v1 matches use non-purchasable Practice Points only. Purchased-coin wagering is disabled.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                GameId.MATCH_ELIGIBLE.forEach { game ->
                    FilterChip(
                        selected = selectedGame == game,
                        onClick = { selectedGame = game },
                        label = { Text(if (state.language == AppLanguage.BN) game.titleBn else game.titleEn) }
                    )
                }
            }
        }
        item {
            Button(
                onClick = { onCreateMatch(selectedGame, 50L) },
                enabled = !isOfflineOnlyMode && state.firebaseConfigured,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Create 1v1 Match Lobby (${selectedGame.titleEn} • 50 Practice Points)")
            }
            if (isOfflineOnlyMode || !state.firebaseConfigured) {
                Text("Online 1v1 matchmaking requires Firebase configuration and an active approved account.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.secondary)
            }
        }
    }
}

@Composable
private fun WalletAndPurchaseTab(
    state: MainUiState,
    strings: AppStrings,
    isOfflineOnlyMode: Boolean,
    onSubmitPayment: (String, PaymentMethod, String, String) -> Unit
) {
    var selectedMethod by remember { mutableStateOf(PaymentMethod.BKASH) }
    var selectedPackageId by remember { mutableStateOf("pkg_starter_250") }
    var txId by remember { mutableStateOf("") }
    var lastFour by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(strings.wallet, style = MaterialTheme.typography.headlineMedium)
            Text(strings.noCashoutPolicy, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.secondary)
        }
        item {
            Card {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("${strings.purchasedCoins}: ${state.session?.purchasedCoins ?: 0}", style = MaterialTheme.typography.titleMedium)
                    Text("${strings.practicePoints}: ${state.session?.practicePoints ?: 0}", style = MaterialTheme.typography.titleMedium)
                    Text("${strings.premiumMembership}: ${state.session?.premiumTier ?: "FREE"}", style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
        item {
            Text(strings.purchaseCenter, style = MaterialTheme.typography.titleLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                PaymentMethod.entries.forEach { method ->
                    FilterChip(
                        selected = selectedMethod == method,
                        onClick = { selectedMethod = method },
                        label = { Text(method.name) }
                    )
                }
            }
        }
        item {
            OutlinedTextField(
                value = txId,
                onValueChange = { txId = it },
                label = { Text("${selectedMethod.name} Transaction ID") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = lastFour,
                onValueChange = { lastFour = it.filter(Char::isDigit).take(4) },
                label = { Text("Sender Last 4 Digits") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = { onSubmitPayment(selectedPackageId, selectedMethod, txId, lastFour) },
                enabled = !isOfflineOnlyMode && state.firebaseConfigured && txId.length >= 6 && lastFour.length == 4,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Submit Payment for Admin Verification")
            }
            state.statusMessage?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
            state.errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        }
    }
}

@Composable
private fun ProfileAndConsentTab(
    state: MainUiState,
    strings: AppStrings,
    onToggleLanguage: () -> Unit,
    onThemeChange: (AppThemeMode) -> Unit,
    onConsentChange: (Boolean, Boolean) -> Unit,
    onSignOut: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(strings.profile, style = MaterialTheme.typography.headlineMedium)
            Text("Referral Code: ${state.session?.referralCode?.ifBlank { "Requires Registration" } ?: "Offline Practice"}", style = MaterialTheme.typography.bodyLarge)
        }
        item {
            Text("Theme (AMOLED / Dark / Light)", style = MaterialTheme.typography.titleMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AppThemeMode.entries.forEach { mode ->
                    FilterChip(
                        selected = state.themeMode == mode,
                        onClick = { onThemeChange(mode) },
                        label = { Text(mode.name) }
                    )
                }
            }
        }
        item {
            OutlinedButton(onClick = onToggleLanguage, modifier = Modifier.fillMaxWidth()) {
                Text(if (state.language == AppLanguage.EN) "Switch Language: বাংলা" else "Switch Language: English")
            }
        }
        item {
            Card {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(strings.cameraMicConsentTitle, style = MaterialTheme.typography.titleMedium)
                    Text(strings.cameraMicConsentBody, style = MaterialTheme.typography.bodyMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row {
                            Switch(
                                checked = state.micConsentActive,
                                onCheckedChange = { onConsentChange(it, state.cameraConsentActive) }
                            )
                            Spacer(Modifier.width(6.dp))
                            Text("Mic Session")
                        }
                        Row {
                            Switch(
                                checked = state.cameraConsentActive,
                                onCheckedChange = { onConsentChange(state.micConsentActive, it) }
                            )
                            Spacer(Modifier.width(6.dp))
                            Text("Camera Session")
                        }
                    }
                }
            }
        }
        item {
            Button(onClick = onSignOut, modifier = Modifier.fillMaxWidth()) {
                Text(strings.logout)
            }
        }
    }
}

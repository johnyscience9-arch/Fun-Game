package com.funoffline.app.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.funoffline.app.core.i18n.AppStrings
import com.funoffline.app.core.theme.AppThemeMode
import com.funoffline.app.ui.MainUiState

enum class AdminModule(val label: String) {
    DASHBOARD("Dashboard"),
    USERS("User List & Approval"),
    REFERRALS("Referrals"),
    GAMES("Game Management"),
    MATCHES("1v1 Matches"),
    COINS("Coin Management"),
    PAYMENTS("Payment Verification"),
    MEMBERSHIP("Premium Membership"),
    NOTIFICATIONS("Notifications"),
    SECURITY("Security & Permissions"),
    REPORTS("Reports & Ledger")
}

@Composable
fun AdminPortalShell(
    state: MainUiState,
    strings: AppStrings,
    onToggleLanguage: () -> Unit,
    onThemeChange: (AppThemeMode) -> Unit,
    onSignOut: () -> Unit
) {
    var activeModule by remember { mutableStateOf(AdminModule.DASHBOARD) }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            Row(
                modifier = Modifier.fillMaxWidth().statusBarsPadding().padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(strings.adminPanel, style = MaterialTheme.typography.titleLarge)
                    Text("Server-Verified UID: ${state.session?.uid?.take(8).orEmpty()}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onToggleLanguage) { Text(state.language.name) }
                    TextButton(onClick = onSignOut) { Text(strings.logout) }
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Text("Select Admin Module", style = MaterialTheme.typography.titleMedium)
            }
            items(AdminModule.entries.chunked(2)) { pair ->
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    pair.forEach { module ->
                        FilterChip(
                            selected = activeModule == module,
                            onClick = { activeModule = module },
                            label = { Text(module.label) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(activeModule.label, style = MaterialTheme.typography.headlineMedium)
                        Text(
                            when (activeModule) {
                                AdminModule.DASHBOARD -> "Overview of pending user approvals, bKash/Nagad/Rocket/Bank verification queue, and 1v1 match activity."
                                AdminModule.USERS -> "Review pending referral registrations, activate accounts, or suspend policy violators via adminApproveOrSuspendUser."
                                AdminModule.REFERRALS -> "Issue unique referral codes and audit redemption counts without trusting client claims."
                                AdminModule.GAMES -> "Manage the 9-game catalog; Carrom, Pool, and Ludo Star remain the only 1v1 match titles."
                                AdminModule.MATCHES -> "Monitor active 1v1 matches, inspect disconnect forfeits, and review server-authoritative settlements."
                                AdminModule.COINS -> "Issue audited Purchased Coin or Practice Point adjustments; withdrawals and P2P transfers remain disabled."
                                AdminModule.PAYMENTS -> "Verify Transaction IDs from bKash, Nagad, Rocket, and Bank Transfer; approve or reject PENDING submissions."
                                AdminModule.MEMBERSHIP -> "Manage Pro Monthly and Pro Annual package pricing and subscriber expiry."
                                AdminModule.NOTIFICATIONS -> "Broadcast maintenance alerts or targeted account messages."
                                AdminModule.SECURITY -> "Enforce /admins/{uid} allowlist, revoke refresh tokens on suspension, and audit Camera/Mic consent logs."
                                AdminModule.REPORTS -> "Export immutable coin ledger entries and admin audit logs."
                            },
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                }
            }
        }
    }
}

package com.funoffline.app.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.funoffline.app.core.i18n.AppStrings
import com.funoffline.app.core.theme.AppThemeMode
import com.funoffline.app.ui.MainUiState

@Composable
fun AuthGateScreen(
    state: MainUiState,
    strings: AppStrings,
    onSignIn: (String, String) -> Unit,
    onRegister: (String, String, String, String, String) -> Unit,
    onToggleLanguage: () -> Unit,
    onThemeChange: (AppThemeMode) -> Unit,
    onEnterOfflinePractice: () -> Unit
) {
    var isRegisterTab by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var displayName by remember { mutableStateOf("") }
    var referralCode by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(strings.appName, style = MaterialTheme.typography.headlineLarge)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onToggleLanguage) {
                        Text(if (state.language.name == "EN") "বাংলা" else "EN")
                    }
                    OutlinedButton(onClick = {
                        val next = when (state.themeMode) {
                            AppThemeMode.AMOLED -> AppThemeMode.DARK
                            AppThemeMode.DARK -> AppThemeMode.LIGHT
                            AppThemeMode.LIGHT -> AppThemeMode.AMOLED
                        }
                        onThemeChange(next)
                    }) {
                        Text(state.themeMode.name)
                    }
                }
            }

            if (!state.firebaseConfigured) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(strings.firebaseMissingTitle, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.secondary)
                        Text(strings.firebaseMissingBody, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = !isRegisterTab,
                    onClick = { isRegisterTab = false },
                    label = { Text(strings.signIn) }
                )
                FilterChip(
                    selected = isRegisterTab,
                    onClick = { isRegisterTab = true },
                    label = { Text(strings.registerWithReferral) }
                )
            }

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                visualTransformation = PasswordVisualTransformation(),
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            if (isRegisterTab) {
                OutlinedTextField(
                    value = displayName,
                    onValueChange = { displayName = it },
                    label = { Text("Player Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = referralCode,
                    onValueChange = { referralCode = it.uppercase() },
                    label = { Text("Unique Referral Code (Required)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone (Stored in isolated PII doc)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            state.errorMessage?.let { err ->
                Text(err, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
            }

            Button(
                onClick = {
                    if (isRegisterTab) onRegister(email, password, displayName, referralCode, phone)
                    else onSignIn(email, password)
                },
                enabled = state.firebaseConfigured && !state.isLoading,
                modifier = Modifier.fillMaxWidth().height(50.dp)
            ) {
                Text(if (isRegisterTab) strings.registerWithReferral else strings.signIn)
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outline)

            OutlinedButton(
                onClick = onEnterOfflinePractice,
                modifier = Modifier.fillMaxWidth().height(48.dp)
            ) {
                Text("${strings.freePlay} (Offline 9 Games)")
            }
        }
    }
}

@Composable
fun PendingApprovalScreen(
    strings: AppStrings,
    onRefresh: () -> Unit,
    onEnterOfflinePractice: () -> Unit,
    onSignOut: () -> Unit
) {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Text(strings.pendingApprovalTitle, style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(12.dp))
            Text(strings.pendingApprovalBody, style = MaterialTheme.typography.bodyLarge)
            Spacer(Modifier.height(24.dp))
            Button(onClick = onRefresh, modifier = Modifier.fillMaxWidth()) {
                Text("Check Approval Status")
            }
            Spacer(Modifier.height(8.dp))
            OutlinedButton(onClick = onEnterOfflinePractice, modifier = Modifier.fillMaxWidth()) {
                Text("${strings.freePlay} (Offline 9 Games)")
            }
            Spacer(Modifier.height(8.dp))
            TextButton(onClick = onSignOut, modifier = Modifier.fillMaxWidth()) {
                Text(strings.logout)
            }
        }
    }
}

@Composable
fun SuspendedScreen(
    strings: AppStrings,
    onSignOut: () -> Unit
) {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Text(strings.suspendedTitle, style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.error)
            Spacer(Modifier.height(12.dp))
            Text("Access to online wallets and 1v1 matches has been suspended by a server-verified administrator.")
            Spacer(Modifier.height(24.dp))
            Button(onClick = onSignOut, modifier = Modifier.fillMaxWidth()) {
                Text(strings.logout)
            }
        }
    }
}

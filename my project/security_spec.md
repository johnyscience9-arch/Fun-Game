# FUN OFFLINE — Security Specification & Threat Model

## 1. Data Invariants
1. **Server-Verified Role Separation**: A user document's `role` (`USER` | `ADMIN`) and `/admins/{uid}` membership can NEVER be written by any client SDK. Clients cannot self-promote to `ADMIN` or `ACTIVE` from `PENDING_APPROVAL`.
2. **Server-Authoritative Dual Wallet**: `purchasedCoins`, `practicePoints`, `premiumTier`, and `premiumExpiresAtMs` can ONLY be modified inside trusted Firebase Cloud Functions / Admin SDK transactions. Direct client writes to `/users/{uid}` may ONLY update `preferredTheme` and `preferredLanguage`.
3. **No Cash-Out / No P2P Transfer**: There is no withdrawal collection, no transfer endpoint, and `transactions` are strictly server-written append-only records.
4. **1v1 Match Gate**: `/matches/{matchId}` strictly validates `gameId in ['carrom', 'pool', 'ludo_star']`. Teen Patti, Level Devil, Mini Militia, Brick Block, Balloon Shooter, and Archery cannot create 1v1 match documents.
5. **Payment Integrity**: Users may only read their own `/payments/{paymentId}` rows. Creating a payment directly from client SDK is blocked in favor of the `submitPaymentOrder` Cloud Function (or strictly enforced `status == 'PENDING'`), and updates to `status` (`APPROVED`/`REJECTED`) are server-only / admin-only and locked once terminal.
6. **PII Isolation**: Email and phone numbers live under `/users/{uid}/private/info`, readable strictly by the owning UID or a verified `/admins/{uid}`.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Self-Admin Escalation**: Client attempts `setDoc('/admins/' + uid, { active: true })`.
2. **Profile Role Tamper**: Client attempts `updateDoc('/users/' + uid, { role: 'ADMIN', accountStatus: 'ACTIVE' })`.
3. **Client Coin Injection**: Client attempts `updateDoc('/users/' + uid, { purchasedCoins: 999999 })`.
4. **Fake Ledger Entry**: Client attempts `setDoc('/transactions/tx_fake', { userId: uid, bucket: 'PURCHASED_COINS', delta: 10000 })`.
5. **Self-Approve Payment**: Client creates or updates `/payments/pay_1` with `{ status: 'APPROVED' }`.
6. **Re-Open Terminal Payment**: Admin or user attempts to mutate a payment whose `status` is already `'APPROVED'` or `'REJECTED'`.
7. **Unauthorized Teen Patti Match**: Client attempts `setDoc('/matches/m_tp', { gameId: 'teen_patti', hostUserId: uid })`.
8. **Client Match Result Spoofing**: Match participant attempts `updateDoc('/matches/m1', { status: 'COMPLETED', winnerUserId: uid })`.
9. **Cross-User PII Scrape**: Authenticated user B calls `getDoc('/users/' + userA + '/private/info')`.
10. **Blanket Payment List**: Non-admin user runs `getDocs(collection(db, 'payments'))` without `where('userId', '==', uid)`.
11. **Oversized ID Poisoning**: Client writes document with 1,500-character document ID or `displayName` exceeding 48 chars.
12. **Shadow Field Injection**: Client writes `{ preferredTheme: 'AMOLED', isVerified: true }` onto `/users/{uid}`.

import * as admin from 'firebase-admin';
import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

const MATCH_ELIGIBLE_GAMES = new Set(['carrom', 'pool', 'ludo_star']);
const ALLOWED_METHODS = new Set(['BKASH', 'NAGAD', 'ROCKET', 'BANK_TRANSFER']);

function requireAuth(request: CallableRequest): string {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Valid Firebase Auth session required.');
  }
  return request.auth.uid;
}

async function requireAdmin(request: CallableRequest): Promise<string> {
  const uid = requireAuth(request);
  const adminDoc = await db.collection('admins').doc(uid).get();
  if (!adminDoc.exists || adminDoc.data()?.active !== true) {
    throw new HttpsError('permission-denied', 'Server-verified ADMIN role required.');
  }
  return uid;
}

async function requireActiveUser(uid: string): Promise<FirebaseFirestore.DocumentData> {
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'User profile not registered.');
  }
  const data = snap.data()!;
  if (data.accountStatus !== 'ACTIVE') {
    throw new HttpsError(
      'failed-precondition',
      `Account status is ${data.accountStatus}. Admin approval is required.`
    );
  }
  return data;
}

function generateReferralCode(uid: string): string {
  const prefix = uid.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FUN${prefix}${suffix}`;
}

export const registerWithReferral = onCall(async (request) => {
  const uid = requireAuth(request);
  const { displayName, referralCodeInput, phone } = request.data as {
    displayName: string;
    referralCodeInput: string;
    phone?: string;
  };

  if (!displayName || displayName.trim().length < 2 || displayName.trim().length > 48) {
    throw new HttpsError('invalid-argument', 'Display name must be 2 to 48 characters.');
  }
  const normalizedRef = (referralCodeInput ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9]{6,16}$/.test(normalizedRef)) {
    throw new HttpsError('invalid-argument', 'A valid referral code is required to register.');
  }

  const userRecord = await auth.getUser(uid);
  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async (tx) => {
    const existingUser = await tx.get(userRef);
    if (existingUser.exists) {
      throw new HttpsError('already-exists', 'User profile already exists.');
    }

    const refDoc = await tx.get(db.collection('referrals').doc(normalizedRef));
    if (!refDoc.exists || refDoc.data()?.active !== true) {
      throw new HttpsError('not-found', 'Referral code is invalid or inactive.');
    }

    const ownReferralCode = generateReferralCode(uid);
    const now = admin.firestore.FieldValue.serverTimestamp();

    tx.set(userRef, {
      uid,
      displayName: displayName.trim(),
      referralCode: ownReferralCode,
      referredByCode: normalizedRef,
      referredByUid: refDoc.data()?.ownerUid ?? null,
      role: 'USER',
      accountStatus: 'PENDING_APPROVAL',
      purchasedCoins: 0,
      practicePoints: 250,
      premiumTier: 'FREE',
      premiumExpiresAtMs: 0,
      preferredTheme: 'AMOLED',
      preferredLanguage: 'en',
      createdAt: now,
      updatedAt: now,
    });

    tx.set(userRef.collection('private').doc('info'), {
      uid,
      email: userRecord.email ?? '',
      phone: typeof phone === 'string' ? phone.slice(0, 32) : '',
      lastConsentGrantAtMs: 0,
      updatedAt: now,
    });

    tx.set(db.collection('referrals').doc(ownReferralCode), {
      code: ownReferralCode,
      ownerUid: uid,
      active: true,
      redemptionCount: 0,
      createdAt: now,
    });
  });

  return { status: 'PENDING_APPROVAL' };
});

export const verifySessionRole = onCall(async (request) => {
  const uid = requireAuth(request);
  const [userSnap, adminSnap] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('admins').doc(uid).get(),
  ]);

  const isAdmin = adminSnap.exists && adminSnap.data()?.active === true;
  if (!userSnap.exists) {
    return { registered: false, role: isAdmin ? 'ADMIN' : 'USER', accountStatus: 'UNREGISTERED' };
  }
  const user = userSnap.data()!;
  return {
    registered: true,
    role: isAdmin ? 'ADMIN' : 'USER',
    accountStatus: user.accountStatus,
    purchasedCoins: user.purchasedCoins,
    practicePoints: user.practicePoints,
    premiumTier: user.premiumTier,
  };
});

export const adminApproveOrSuspendUser = onCall(async (request) => {
  const adminUid = await requireAdmin(request);
  const { targetUid, decision, reason } = request.data as {
    targetUid: string;
    decision: 'ACTIVE' | 'SUSPENDED';
    reason?: string;
  };
  if (!targetUid || (decision !== 'ACTIVE' && decision !== 'SUSPENDED')) {
    throw new HttpsError('invalid-argument', 'Invalid targetUid or decision.');
  }

  const targetRef = db.collection('users').doc(targetUid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(targetRef);
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Target user not found.');
    }
    const prevStatus = snap.data()!.accountStatus;
    const referredByUid = snap.data()!.referredByUid as string | null;
    const now = admin.firestore.FieldValue.serverTimestamp();

    tx.update(targetRef, { accountStatus: decision, updatedAt: now });

    // Credit one-time referral reward when a pending user is approved for the first time
    if (prevStatus === 'PENDING_APPROVAL' && decision === 'ACTIVE' && referredByUid) {
      const inviterRef = db.collection('users').doc(referredByUid);
      const inviterSnap = await tx.get(inviterRef);
      if (inviterSnap.exists) {
        tx.update(inviterRef, {
          practicePoints: admin.firestore.FieldValue.increment(150),
          updatedAt: now,
        });
        tx.set(db.collection('transactions').doc(), {
          userId: referredByUid,
          bucket: 'PRACTICE_POINTS',
          delta: 150,
          reason: 'REFERRAL_REWARD',
          referenceId: targetUid,
          createdAt: now,
        });
      }
    }

    tx.set(db.collection('adminAuditLogs').doc(), {
      adminUid,
      action: `USER_${decision}`,
      targetId: targetUid,
      reason: (reason ?? '').slice(0, 200),
      createdAt: now,
    });
  });

  if (decision === 'SUSPENDED') {
    await auth.revokeRefreshTokens(targetUid);
  }
  return { ok: true, targetUid, accountStatus: decision };
});

export const submitPaymentOrder = onCall(async (request) => {
  const uid = requireAuth(request);
  await requireActiveUser(uid);
  const { packageId, method, transactionId, senderLastFour } = request.data as {
    packageId: string;
    method: string;
    transactionId: string;
    senderLastFour: string;
  };

  if (!ALLOWED_METHODS.has(method)) {
    throw new HttpsError('invalid-argument', 'Unsupported payment method.');
  }
  const cleanTx = (transactionId ?? '').trim();
  if (!/^[A-Za-z0-9\-_]{6,40}$/.test(cleanTx)) {
    throw new HttpsError('invalid-argument', 'Invalid transaction ID format.');
  }
  if (!/^[0-9]{4}$/.test(senderLastFour ?? '')) {
    throw new HttpsError('invalid-argument', 'Sender last 4 digits must be numeric.');
  }

  const pkgSnap = await db.collection('packages').doc(packageId).get();
  if (!pkgSnap.exists || pkgSnap.data()?.active !== true) {
    throw new HttpsError('not-found', 'Selected package is unavailable.');
  }
  const pkg = pkgSnap.data()!;
  const now = admin.firestore.FieldValue.serverTimestamp();
  const docRef = db.collection('payments').doc();

  await docRef.set({
    id: docRef.id,
    userId: uid,
    packageId,
    method,
    transactionId: cleanTx,
    senderLastFour,
    amountBdt: pkg.priceBdt,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  });

  return { paymentId: docRef.id, status: 'PENDING' };
});

export const adminReviewPaymentOrder = onCall(async (request) => {
  const adminUid = await requireAdmin(request);
  const { paymentId, decision, note } = request.data as {
    paymentId: string;
    decision: 'APPROVED' | 'REJECTED';
    note?: string;
  };
  if (!paymentId || (decision !== 'APPROVED' && decision !== 'REJECTED')) {
    throw new HttpsError('invalid-argument', 'Invalid payment review input.');
  }

  const payRef = db.collection('payments').doc(paymentId);
  await db.runTransaction(async (tx) => {
    const paySnap = await tx.get(payRef);
    if (!paySnap.exists) {
      throw new HttpsError('not-found', 'Payment order not found.');
    }
    const pay = paySnap.data()!;
    if (pay.status !== 'PENDING') {
      throw new HttpsError('failed-precondition', 'Payment order is already finalized.');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    tx.update(payRef, {
      status: decision,
      reviewedByAdminId: adminUid,
      reviewNote: (note ?? '').slice(0, 240),
      updatedAt: now,
    });

    if (decision === 'APPROVED') {
      const pkgSnap = await tx.get(db.collection('packages').doc(pay.packageId));
      if (!pkgSnap.exists) {
        throw new HttpsError('not-found', 'Referenced package missing.');
      }
      const pkg = pkgSnap.data()!;
      const userRef = db.collection('users').doc(pay.userId);
      const updates: Record<string, unknown> = { updatedAt: now };

      if (pkg.coinAmount > 0) {
        updates.purchasedCoins = admin.firestore.FieldValue.increment(pkg.coinAmount);
        tx.set(db.collection('transactions').doc(), {
          userId: pay.userId,
          bucket: 'PURCHASED_COINS',
          delta: pkg.coinAmount,
          reason: 'PACKAGE_PURCHASE',
          referenceId: paymentId,
          createdAt: now,
        });
      }
      if (pkg.isMembership && pkg.membershipDays > 0) {
        updates.premiumTier = pkg.membershipDays >= 300 ? 'PRO_ANNUAL' : 'PRO_MONTHLY';
        updates.premiumExpiresAtMs = Date.now() + pkg.membershipDays * 86_400_000;
      }
      tx.update(userRef, updates);
    }

    tx.set(db.collection('adminAuditLogs').doc(), {
      adminUid,
      action: `PAYMENT_${decision}`,
      targetId: paymentId,
      createdAt: now,
    });
  });

  return { ok: true, paymentId, status: decision };
});

export const createOrJoinMatch = onCall(async (request) => {
  const uid = requireAuth(request);
  await requireActiveUser(uid);
  const { gameId, matchId, practiceEntryPoints } = request.data as {
    gameId: string;
    matchId?: string;
    practiceEntryPoints?: number;
  };

  if (!MATCH_ELIGIBLE_GAMES.has(gameId)) {
    throw new HttpsError(
      'invalid-argument',
      '1v1 matchmaking is strictly restricted to carrom, pool, and ludo_star.'
    );
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  if (!matchId) {
    const entry = Math.max(0, Math.floor(practiceEntryPoints ?? 50));
    const docRef = db.collection('matches').doc();
    await docRef.set({
      id: docRef.id,
      gameId,
      hostUserId: uid,
      guestUserId: null,
      hostAccepted: true,
      guestAccepted: false,
      practiceEntryPoints: entry,
      status: 'WAITING_OPPONENT',
      expiresAtMs: Date.now() + 120_000,
      createdAt: now,
      updatedAt: now,
    });
    return { matchId: docRef.id, status: 'WAITING_OPPONENT' };
  }

  const mRef = db.collection('matches').doc(matchId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(mRef);
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Match not found.');
    }
    const m = snap.data()!;
    if (m.status !== 'WAITING_OPPONENT') {
      throw new HttpsError('failed-precondition', 'Match is no longer open.');
    }
    if (m.hostUserId === uid) {
      throw new HttpsError('invalid-argument', 'Cannot join your own match.');
    }
    tx.update(mRef, {
      guestUserId: uid,
      status: 'AWAITING_ACCEPTANCE',
      updatedAt: now,
    });
  });

  return { matchId, status: 'AWAITING_ACCEPTANCE' };
});

export const acceptMatch = onCall(async (request) => {
  const uid = requireAuth(request);
  await requireActiveUser(uid);
  const { matchId } = request.data as { matchId: string };
  const mRef = db.collection('matches').doc(matchId);

  let nextStatus = 'AWAITING_ACCEPTANCE';
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(mRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Match not found.');
    const m = snap.data()!;
    if (m.status !== 'AWAITING_ACCEPTANCE') {
      throw new HttpsError('failed-precondition', 'Match not awaiting acceptance.');
    }
    if (uid !== m.hostUserId && uid !== m.guestUserId) {
      throw new HttpsError('permission-denied', 'Not a participant.');
    }
    const hostAccepted = m.hostAccepted || uid === m.hostUserId;
    const guestAccepted = m.guestAccepted || uid === m.guestUserId;
    nextStatus = hostAccepted && guestAccepted ? 'ACTIVE' : 'AWAITING_ACCEPTANCE';
    tx.update(mRef, {
      hostAccepted,
      guestAccepted,
      status: nextStatus,
      expiresAtMs: nextStatus === 'ACTIVE' ? Date.now() + 300_000 : m.expiresAtMs,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { matchId, status: nextStatus };
});

export const settleMatchServer = onCall(async (request) => {
  const uid = requireAuth(request);
  const { matchId, winnerUserId, disconnectUserId } = request.data as {
    matchId: string;
    winnerUserId?: string;
    disconnectUserId?: string;
  };
  const mRef = db.collection('matches').doc(matchId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(mRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Match not found.');
    const m = snap.data()!;
    if (m.status !== 'ACTIVE') {
      throw new HttpsError('failed-precondition', 'Match is not active.');
    }
    if (uid !== m.hostUserId && uid !== m.guestUserId) {
      throw new HttpsError('permission-denied', 'Unauthorized caller.');
    }

    const resolvedWinner = disconnectUserId
      ? disconnectUserId === m.hostUserId
        ? m.guestUserId
        : m.hostUserId
      : winnerUserId;

    if (resolvedWinner !== m.hostUserId && resolvedWinner !== m.guestUserId) {
      throw new HttpsError('invalid-argument', 'Winner must be a match participant.');
    }

    const finalStatus = disconnectUserId ? 'FORFEIT_DISCONNECT' : 'COMPLETED';
    const now = admin.firestore.FieldValue.serverTimestamp();
    tx.update(mRef, {
      status: finalStatus,
      winnerUserId: resolvedWinner,
      disconnectUserId: disconnectUserId ?? null,
      updatedAt: now,
    });

    const rewardPoints = Math.max(25, Number(m.practiceEntryPoints ?? 50));
    tx.update(db.collection('users').doc(resolvedWinner), {
      practicePoints: admin.firestore.FieldValue.increment(rewardPoints),
      updatedAt: now,
    });
    tx.set(db.collection('transactions').doc(), {
      userId: resolvedWinner,
      bucket: 'PRACTICE_POINTS',
      delta: rewardPoints,
      reason: 'MATCH_WIN_PRACTICE',
      referenceId: matchId,
      createdAt: now,
    });
  });

  return { ok: true, matchId };
});

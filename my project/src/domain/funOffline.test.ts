import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_CATALOG, isMatchEligibleGame, type GameId } from './catalog';
import {
  applyLedgerMutation,
  assertNoCashOutOrTransfer,
  assertNoPurchasedCoinWagering,
  EconomyPolicyError,
  purchaseInventoryItem,
  reviewPaymentSubmission,
  validateTransactionId,
  type CoinPackage,
  type PaymentSubmission,
} from './economy';
import {
  acceptMatchSession,
  createMatchSession,
  joinMatchSession,
  MatchPolicyError,
  settleMatchDisconnect,
  settleMatchResult,
} from './matchmaking';
import { TRANSLATIONS } from './i18n';

test('catalog has exactly the 9 requested games in order and only Carrom, Pool, Ludo Star allow 1v1', () => {
  assert.equal(GAME_CATALOG.length, 9);
  const ids = GAME_CATALOG.map((g) => g.id);
  assert.deepEqual(ids, [
    'level_devil',
    'mini_militia',
    'carrom',
    'teen_patti',
    'brick_block',
    'pool',
    'balloon_shooter',
    'archery',
    'ludo_star',
  ]);

  const matchEnabled = GAME_CATALOG.filter((g) => g.supports1v1Match).map((g) => g.id);
  assert.deepEqual(matchEnabled, ['carrom', 'pool', 'ludo_star']);

  for (const game of GAME_CATALOG) {
    assert.equal(game.wageringAllowed, false);
    assert.equal(game.supportsOfflinePractice, true);
  }
});

test('1v1 matchmaking rejects non-eligible games including Teen Patti and Level Devil', () => {
  const disallowed: GameId[] = [
    'level_devil',
    'mini_militia',
    'teen_patti',
    'brick_block',
    'balloon_shooter',
    'archery',
  ];
  for (const gameId of disallowed) {
    assert.equal(isMatchEligibleGame(gameId), false);
    assert.throws(
      () =>
        createMatchSession({
          id: 'm1',
          gameId,
          hostUserId: 'u1',
          practiceEntryPoints: 50,
          durationSeconds: 300,
          nowMs: 1000,
        }),
      MatchPolicyError
    );
  }
});

test('1v1 match lifecycle: create, join, accept, disconnect forfeit, and server-authoritative settle', () => {
  const created = createMatchSession({
    id: 'm_carrom_1',
    gameId: 'carrom',
    hostUserId: 'user_a',
    practiceEntryPoints: 100,
    durationSeconds: 300,
    nowMs: 1_000_000,
  });
  assert.equal(created.status, 'WAITING_OPPONENT');

  assert.throws(() => joinMatchSession(created, 'user_a'), MatchPolicyError);
  const joined = joinMatchSession(created, 'user_b');
  assert.equal(joined.status, 'AWAITING_ACCEPTANCE');

  const active = acceptMatchSession(joined, 'user_b', 1_010_000);
  assert.equal(active.status, 'ACTIVE');

  assert.throws(() => settleMatchResult(active, 'user_a', false), MatchPolicyError);
  const settled = settleMatchResult(active, 'user_a', true);
  assert.equal(settled.status, 'COMPLETED');
  assert.equal(settled.winnerUserId, 'user_a');

  const forfeit = settleMatchDisconnect(active, 'user_b');
  assert.equal(forfeit.status, 'FORFEIT_DISCONNECT');
  assert.equal(forfeit.winnerUserId, 'user_a');
});

test('dual wallet forbids cash-out, P2P transfer, purchased-coin wagering, and negative balances', () => {
  assert.throws(() => assertNoCashOutOrTransfer('withdraw'), EconomyPolicyError);
  assert.throws(() => assertNoCashOutOrTransfer('p2p_transfer'), EconomyPolicyError);
  assert.throws(() => assertNoPurchasedCoinWagering('PURCHASED_COINS'), EconomyPolicyError);

  const wallet = { purchasedCoins: 200, practicePoints: 500 };
  assert.throws(
    () => applyLedgerMutation(wallet, 'PURCHASED_COINS', -250),
    EconomyPolicyError
  );

  const afterPurchase = purchaseInventoryItem(wallet, new Set(), {
    id: 'skin_carrom_obsidian',
    nameEn: 'Obsidian Striker',
    nameBn: 'অবসিডিয়ান স্ট্রাইকার',
    gameId: 'carrom',
    priceBucket: 'PURCHASED_COINS',
    priceAmount: 150,
  });
  assert.equal(afterPurchase.wallet.purchasedCoins, 50);
  assert.equal(afterPurchase.wallet.practicePoints, 500);
  assert.equal(afterPurchase.ownedItemIds.has('skin_carrom_obsidian'), true);
});

test('purchase center validation and single-use admin approval state transition', () => {
  assert.equal(validateTransactionId('BKASH', 'TXN99887766'), true);
  assert.equal(validateTransactionId('NAGAD', '123'), false);

  const pkg: CoinPackage = {
    id: 'pkg_500',
    nameEn: '500 Fun Coins',
    nameBn: '৫০০ ফান কয়েন',
    coinAmount: 500,
    priceBdt: 199,
    isMembership: false,
    active: true,
  };
  const sub: PaymentSubmission = {
    id: 'pay_01',
    userId: 'user_a',
    packageId: 'pkg_500',
    method: 'BKASH',
    transactionId: 'BKA98765432',
    senderLastFour: '4421',
    amountBdt: 199,
    status: 'PENDING',
    createdAtMs: 1000,
    updatedAtMs: 1000,
  };

  const approved = reviewPaymentSubmission(
    sub,
    'APPROVED',
    'admin_1',
    pkg,
    { purchasedCoins: 100, practicePoints: 250 },
    2000,
    'Verified in bKash merchant portal'
  );
  assert.equal(approved.submission.status, 'APPROVED');
  assert.equal(approved.wallet.purchasedCoins, 600);
  assert.equal(approved.ledgerEntry?.delta, 500);

  assert.throws(
    () =>
      reviewPaymentSubmission(
        approved.submission,
        'APPROVED',
        'admin_1',
        pkg,
        approved.wallet,
        3000
      ),
    EconomyPolicyError
  );
});

test('Bangla and English translation dictionaries have identical non-empty keys', () => {
  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  const bnKeys = Object.keys(TRANSLATIONS.bn).sort();
  assert.deepEqual(enKeys, bnKeys);
  for (const key of enKeys) {
    assert.ok(TRANSLATIONS.en[key].trim().length > 0);
    assert.ok(TRANSLATIONS.bn[key].trim().length > 0);
  }
});

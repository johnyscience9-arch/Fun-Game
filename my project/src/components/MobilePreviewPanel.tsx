import React, { useState } from 'react';
import {
  GAME_CATALOG,
  type GameId,
  type GameSpec,
} from '../domain/catalog';
import {
  validateTransactionId,
  type PaymentMethod,
} from '../domain/economy';
import { Language, t } from '../domain/i18n';
import { MiniGameCanvas } from './MiniGameCanvas';

export type PreviewTheme = 'AMOLED' | 'DARK' | 'LIGHT';
export type PreviewRole = 'USER' | 'ADMIN';
type UserTab = 'home' | 'games' | 'matches' | 'wallet' | 'profile';
type AdminModuleId =
  | 'dashboard'
  | 'users'
  | 'referrals'
  | 'games'
  | 'matches'
  | 'coins'
  | 'payments'
  | 'membership'
  | 'notifications'
  | 'security'
  | 'reports';

interface MobilePreviewPanelProps {
  language: Language;
  previewTheme: PreviewTheme;
  onChangeTheme: (theme: PreviewTheme) => void;
  onToggleLanguage: () => void;
}

const ADMIN_MODULES: { id: AdminModuleId; labelEn: string; labelBn: string; detail: string }[] = [
  { id: 'dashboard', labelEn: 'Dashboard', labelBn: 'ড্যাশবোর্ড', detail: 'Role-verified overview of pending registrations, bKash/Nagad/Rocket/Bank review queue, and active 1v1 lobbies.' },
  { id: 'users', labelEn: 'User List & Approval', labelBn: 'ইউজার ও অনুমোদন', detail: 'Approve referral-registered accounts (PENDING_APPROVAL -> ACTIVE) or suspend accounts via adminApproveOrSuspendUser.' },
  { id: 'referrals', labelEn: 'Referrals', labelBn: 'রেফারেল', detail: 'Issue unique referral codes, track redemption counts, and audit Practice Point rewards.' },
  { id: 'games', labelEn: 'Game Management', labelBn: 'গেম পরিচালনা', detail: 'Toggle maintenance mode across the 9 games; Carrom, Pool, and Ludo Star remain the sole 1v1 match titles.' },
  { id: 'matches', labelEn: 'Match Management', labelBn: '১v১ ম্যাচ', detail: 'Inspect Carrom, Pool, and Ludo Star 1v1 lobbies, timers, disconnect forfeits, and server-authoritative winners.' },
  { id: 'coins', labelEn: 'Coin Management', labelBn: 'কয়েন লেজার', detail: 'Server-audited Purchased Coin and Practice Point adjustments. Cash-out and P2P transfers remain permanently disabled.' },
  { id: 'payments', labelEn: 'Payment Verification', labelBn: 'পেমেন্ট যাচাই', detail: 'Verify Transaction IDs for bKash, Nagad, Rocket, and Bank Transfer; transition PENDING -> APPROVED or REJECTED.' },
  { id: 'membership', labelEn: 'Premium Membership', labelBn: 'প্রিমিয়াম মেম্বারশিপ', detail: 'Edit Pro Monthly & Pro Annual package pricing in BDT and grant server-verified expiry timestamps.' },
  { id: 'notifications', labelEn: 'Notifications', labelBn: 'নোটিফিকেশন', detail: 'Publish maintenance or reward announcements to all users or specific UIDs.' },
  { id: 'security', labelEn: 'Security & Permissions', labelBn: 'নিরাপত্তা ও অনুমতি', detail: 'Verify /admins/{uid} allowlist, revoke refresh tokens on suspension, and inspect Camera/Mic explicit consent logs.' },
  { id: 'reports', labelEn: 'Reports & History', labelBn: 'রিপোর্ট ও ইতিহাস', detail: 'Inspect immutable /transactions and /adminAuditLogs records.' },
];

export const MobilePreviewPanel: React.FC<MobilePreviewPanelProps> = ({
  language,
  previewTheme,
  onChangeTheme,
  onToggleLanguage,
}) => {
  const [role, setRole] = useState<PreviewRole>('USER');
  const [userTab, setUserTab] = useState<UserTab>('home');
  const [selectedGame, setSelectedGame] = useState<GameSpec>(GAME_CATALOG[2]);
  const [matchGameId, setMatchGameId] = useState<GameId>('carrom');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BKASH');
  const [txIdInput, setTxIdInput] = useState('');
  const [senderFourInput, setSenderFourInput] = useState('');
  const [paymentFeedback, setPaymentFeedback] = useState<string | null>(null);
  const [micConsent, setMicConsent] = useState(false);
  const [camConsent, setCamConsent] = useState(false);
  const [adminModule, setAdminModule] = useState<AdminModuleId>('dashboard');

  const phoneSurfaceClass =
    previewTheme === 'AMOLED'
      ? 'bg-black text-zinc-100 border-zinc-800'
      : previewTheme === 'DARK'
        ? 'bg-[#0C0F16] text-zinc-100 border-zinc-700'
        : 'bg-[#F6F7F9] text-zinc-900 border-zinc-300';

  const phoneCardClass =
    previewTheme === 'AMOLED'
      ? 'bg-[#0B0D11] border-zinc-800'
      : previewTheme === 'DARK'
        ? 'bg-[#151A24] border-zinc-700'
        : 'bg-white border-zinc-200';

  const handleValidateTxPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTransactionId(paymentMethod, txIdInput)) {
      setPaymentFeedback(
        language === 'bn'
          ? 'সঠিক ট্রানজেকশন আইডি দিন (কমপক্ষে ৮ অক্ষর)। লাইভ সাবমিশনের জন্য Firebase প্রয়োজন।'
          : 'Enter a valid Transaction ID (8+ chars for mobile wallets). Live submission requires Firebase setup.'
      );
      return;
    }
    if (!/^\d{4}$/.test(senderFourInput)) {
      setPaymentFeedback(
        language === 'bn' ? 'প্রেরকের শেষ ৪ ডিজিট দিন।' : 'Enter the 4 numeric trailing digits of the sender account.'
      );
      return;
    }
    setPaymentFeedback(
      language === 'bn'
        ? `ফরম্যাট সঠিক (${paymentMethod}) — তবে Firebase কনফিগার না থাকায় কোনো ভুয়া অর্ডার পাঠানো হয়নি।`
        : `Format validated (${paymentMethod}) — no fake order submitted because Firebase backend is unconfigured.`
    );
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Controls, Role Switcher, & Interactive 9-Game Canvas */}
      <div className="lg:col-span-7 space-y-6">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D11] p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight">
                {language === 'bn' ? 'একক APK প্রিভিউ ও কন্ট্রোল' : 'Single-APK Interactive Preview'}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {language === 'bn'
                  ? 'সার্ভার-ভেরিফায়েড রোল অনুযায়ী ইউজার ও অ্যাডমিন ড্যাশবোর্ড আলাদা হয়।'
                  : 'Inspect both User and Admin dashboards inside one unified Android application architecture.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleLanguage}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors whitespace-nowrap shrink-0"
            >
              {t(language, 'langToggle')}
            </button>
          </div>

          {/* Role & Theme Segmented Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Simulated View Context (Non-Auth Preview)
              </span>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setRole('USER')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    role === 'USER'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {t(language, 'roleUser')}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    role === 'ADMIN'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {t(language, 'roleAdmin')}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Android Theme Mode
              </span>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900">
                {(['AMOLED', 'DARK', 'LIGHT'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChangeTheme(mode)}
                    className={`flex-1 px-2.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      previewTheme === mode
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Exact 9 Games Catalog + Playable Canvas */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D11] p-6 space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold">{t(language, 'nineGamesHeading')}</h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {t(language, 'matchRestrictedNote')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {GAME_CATALOG.map((game) => {
              const active = selectedGame.id === game.id;
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => {
                    setSelectedGame(game);
                    if (game.supports1v1Match) setMatchGameId(game.id);
                  }}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    active
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="text-sm font-semibold truncate">
                    {game.order}. {language === 'bn' ? game.titleBn : game.titleEn}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                    <span className="truncate">{language === 'bn' ? game.genreBn : game.genreEn}</span>
                    {game.supports1v1Match && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium shrink-0">1v1</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <MiniGameCanvas game={selectedGame} language={language} />
          </div>
        </div>
      </div>

      {/* Right Column: Live Mobile Viewport (390px Android Frame) */}
      <div className="lg:col-span-5 flex justify-center">
        <div
          data-testid="android-device-preview"
          className={`w-full max-w-[390px] rounded-[28px] border-2 shadow-xl overflow-hidden ${phoneSurfaceClass}`}
        >
          {/* Phone Top Bar */}
          <div className="px-4 py-3.5 border-b border-current/10 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold tracking-tight">FUN OFFLINE</div>
              <div className="text-[11px] opacity-70">
                {role === 'ADMIN' ? t(language, 'adminDashboard') : 'Offline Practice · Unconnected'}
              </div>
            </div>
            <span className="text-[11px] font-mono-tabular opacity-75">
              {previewTheme} · {language.toUpperCase()}
            </span>
          </div>

          {/* Phone Body */}
          <div className="p-4 min-h-[520px] flex flex-col justify-between gap-4">
            {role === 'USER' ? (
              <>
                {userTab === 'home' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-xl border ${phoneCardClass}`}>
                        <div className="text-[11px] opacity-70">{t(language, 'purchasedCoins')}</div>
                        <div className="text-xl font-bold font-mono-tabular mt-1">0</div>
                      </div>
                      <div className={`p-3 rounded-xl border ${phoneCardClass}`}>
                        <div className="text-[11px] opacity-70">{t(language, 'practicePoints')}</div>
                        <div className="text-xl font-bold font-mono-tabular text-emerald-500 mt-1">250</div>
                      </div>
                    </div>
                    <p className="text-xs opacity-75">{t(language, 'noCashoutNotice')}</p>

                    <div className={`p-3.5 rounded-xl border space-y-2 ${phoneCardClass}`}>
                      <div className="text-sm font-semibold">{t(language, 'freePlayMode')}</div>
                      <p className="text-xs opacity-75">
                        {language === 'bn'
                          ? selectedGame.summaryBn
                          : selectedGame.summaryEn}
                      </p>
                      <button
                        type="button"
                        onClick={() => setUserTab('games')}
                        className="w-full py-2.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                      >
                        {t(language, 'tabGames')}
                      </button>
                    </div>

                    <div className={`p-3.5 rounded-xl border space-y-1.5 ${phoneCardClass}`}>
                      <div className="text-sm font-semibold">{t(language, 'teenPattiNotice')}</div>
                      <p className="text-xs opacity-75">
                        Teen Patti is permanently locked to AI free-play mode with zero wagering or 1v1 lobby access.
                      </p>
                    </div>
                  </div>
                )}

                {userTab === 'games' && (
                  <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
                    {GAME_CATALOG.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGame(g)}
                        className={`w-full text-left p-3 rounded-xl border flex items-center justify-between gap-2 ${phoneCardClass}`}
                      >
                        <div>
                          <div className="text-sm font-semibold">
                            {g.order}. {language === 'bn' ? g.titleBn : g.titleEn}
                          </div>
                          <div className="text-[11px] opacity-70">
                            {language === 'bn' ? g.genreBn : g.genreEn}
                            {g.supports1v1Match ? ' · 1v1 Enabled' : ' · Offline Only'}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-emerald-500 shrink-0">Play</span>
                      </button>
                    ))}
                  </div>
                )}

                {userTab === 'matches' && (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold">{t(language, 'match1v1Mode')}</div>
                    <p className="text-xs opacity-75">{t(language, 'matchRestrictedNote')}</p>
                    <div className="flex gap-1.5">
                      {GAME_CATALOG.filter((g) => g.supports1v1Match).map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setMatchGameId(g.id)}
                          className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg border ${
                            matchGameId === g.id
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                              : `${phoneCardClass} opacity-80`
                          }`}
                        >
                          {language === 'bn' ? g.titleBn : g.titleEn}
                        </button>
                      ))}
                    </div>
                    <div className={`p-3 rounded-xl border space-y-1.5 text-xs ${phoneCardClass}`}>
                      <div className="font-semibold">Server-Authoritative Match Flow</div>
                      <p className="opacity-75">1. Host creates lobby with Practice Points (never Purchased Coins).</p>
                      <p className="opacity-75">2. Opponent acceptance & 120s timer enforced server-side.</p>
                      <p className="opacity-75">3. Disconnects settle via Cloud Function forfeit check.</p>
                    </div>
                  </div>
                )}

                {userTab === 'wallet' && (
                  <form onSubmit={handleValidateTxPreview} className="space-y-3">
                    <div className="text-sm font-semibold">{t(language, 'purchaseCenter')}</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['BKASH', 'NAGAD', 'ROCKET', 'BANK_TRANSFER'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`py-2 px-2 text-[11px] font-medium rounded-lg border ${
                            paymentMethod === m
                              ? 'border-emerald-500 bg-emerald-500/15'
                              : phoneCardClass
                          }`}
                        >
                          {m.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                    <div>
                      <label htmlFor="preview-tx-id" className="block text-[11px] opacity-75 mb-1">
                        {t(language, 'submitTxId')} ({paymentMethod})
                      </label>
                      <input
                        id="preview-tx-id"
                        value={txIdInput}
                        onChange={(e) => setTxIdInput(e.target.value)}
                        placeholder="e.g. BKA98765432"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-700 bg-transparent focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="preview-last-four" className="block text-[11px] opacity-75 mb-1">
                        Sender Last 4 Digits
                      </label>
                      <input
                        id="preview-last-four"
                        value={senderFourInput}
                        onChange={(e) => setSenderFourInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="4421"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-700 bg-transparent focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                    >
                      Validate Format (Requires Firebase)
                    </button>
                    {paymentFeedback && (
                      <p className="text-[11px] text-amber-500">{paymentFeedback}</p>
                    )}
                  </form>
                )}

                {userTab === 'profile' && (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-xl border space-y-2 ${phoneCardClass}`}>
                      <div className="text-sm font-semibold">{t(language, 'cameraMicConsent')}</div>
                      <p className="text-[11px] opacity-75">{t(language, 'consentRequiredBody')}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span>Microphone Session</span>
                        <button
                          type="button"
                          onClick={() => setMicConsent((v) => !v)}
                          className={`px-3 py-1 rounded-md text-xs font-medium ${
                            micConsent ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {micConsent ? 'Active (Indicator On)' : 'Off'}
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Camera Session</span>
                        <button
                          type="button"
                          onClick={() => setCamConsent((v) => !v)}
                          className={`px-3 py-1 rounded-md text-xs font-medium ${
                            camConsent ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {camConsent ? 'Active (Indicator On)' : 'Off'}
                        </button>
                      </div>
                      {(micConsent || camConsent) && (
                        <div className="text-[11px] text-emerald-500 pt-1">
                          Android Foreground Privacy Notification Active
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* User Bottom Navigation */}
                <nav className="grid grid-cols-5 gap-1 pt-2 border-t border-current/10">
                  {(
                    [
                      ['home', t(language, 'tabHome')],
                      ['games', t(language, 'tabGames')],
                      ['matches', t(language, 'tabMatches')],
                      ['wallet', t(language, 'tabWallet')],
                      ['profile', t(language, 'tabProfile')],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setUserTab(id)}
                      className={`py-2 px-1 text-[11px] font-medium rounded-lg transition-colors truncate ${
                        userTab === id ? 'text-emerald-500 bg-emerald-500/10' : 'opacity-70'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              </>
            ) : (
              /* Admin Role Preview inside same APK */
              <div className="space-y-3">
                <div className="text-xs opacity-75">
                  Server-verified role via <code className="font-mono">/admins/&#123;uid&#125;</code>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-[240px] overflow-y-auto">
                  {ADMIN_MODULES.map((mod) => (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => setAdminModule(mod.id)}
                      className={`p-2 text-left text-[11px] font-medium rounded-lg border truncate ${
                        adminModule === mod.id
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                          : phoneCardClass
                      }`}
                    >
                      {language === 'bn' ? mod.labelBn : mod.labelEn}
                    </button>
                  ))}
                </div>
                <div className={`p-3.5 rounded-xl border space-y-2 ${phoneCardClass}`}>
                  <div className="text-sm font-semibold">
                    {ADMIN_MODULES.find((m) => m.id === adminModule)?.labelEn}
                  </div>
                  <p className="text-xs opacity-80 leading-relaxed">
                    {ADMIN_MODULES.find((m) => m.id === adminModule)?.detail}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

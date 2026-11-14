import React from 'react';
import { Language } from '../domain/i18n';

interface ArchitectureAndSetupPanelProps {
  language: Language;
}

const CHECKLIST = [
  {
    item: 'Firebase Auth & Firestore Provisioning',
    status: 'External Action Required',
    detail:
      'Firebase setup was declined in this session. Download google-services.json from Firebase Console into android/app/google-services.json and deploy firestore.rules + backend/ Cloud Functions.',
  },
  {
    item: 'Android SDK / JDK 17 Gradle Build',
    status: 'Local Android Studio Required',
    detail:
      'This web container provides Node.js only (no JDK/Android SDK). Open /android in Android Studio Ladybug+ and run ./gradlew testDebugUnitTest assembleDebug.',
  },
  {
    item: 'bKash, Nagad, Rocket & Bank Merchant Accounts',
    status: 'Manual Merchant Setup',
    detail:
      'Users submit Transaction IDs and trailing digits; verified Admins approve or reject PENDING submissions via adminReviewPaymentOrder.',
  },
  {
    item: 'Zero-Trust Role & Balance Security',
    status: 'Implemented in Rules & Functions',
    detail:
      'Client SDKs cannot write role, accountStatus, purchasedCoins, practicePoints, /admins/{uid}, or /transactions. Only server-side Cloud Functions mutate balances.',
  },
  {
    item: 'Camera & Microphone Privacy Compliance',
    status: 'Implemented in Manifest & Service',
    detail:
      'Requires explicit per-session toggle and runs MediaSessionNoticeService foreground notification so Android privacy indicators remain visible.',
  },
];

export const ArchitectureAndSetupPanel: React.FC<ArchitectureAndSetupPanelProps> = ({
  language,
}) => {
  return (
    <section className="space-y-8">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D11] p-6 space-y-4">
        <h2 className="text-xl font-semibold">
          {language === 'bn' ? 'নিরাপত্তা ও বহিঃস্থ কনফিগারেশন তালিকা' : 'Security Architecture & External Configuration Status'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
                <th className="py-3 pr-4 font-medium">Component</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {CHECKLIST.map((row) => (
                <tr key={row.item}>
                  <td className="py-3.5 pr-4 font-medium align-top whitespace-nowrap">{row.item}</td>
                  <td className="py-3.5 pr-4 align-top whitespace-nowrap text-xs font-mono-tabular text-amber-600 dark:text-amber-400">
                    {row.status}
                  </td>
                  <td className="py-3.5 text-zinc-600 dark:text-zinc-400 align-top leading-relaxed">
                    {row.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D11] p-6 space-y-3">
          <h3 className="text-lg font-semibold">Build &amp; Installation Commands</h3>
          <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-100 text-xs font-mono overflow-x-auto leading-relaxed">
{`# 1. Deploy Firestore Rules & Backend Functions
firebase login
firebase use --add <YOUR_PROJECT_ID>
firebase deploy --only firestore:rules
cd backend && npm install && npm run build
firebase deploy --only functions

# 2. Place google-services.json into android/app/
# 3. Compile & test Android APK
cd ../android
./gradlew testDebugUnitTest
./gradlew assembleDebug`}
          </pre>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D11] p-6 space-y-3">
          <h3 className="text-lg font-semibold">Economy &amp; Match Invariants</h3>
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <li>1. Exactly 9 games included: Level Devil, Mini Militia, Carrom, Teen Patti, Brick Block, Pool, Balloon Shooter, Archery, Ludo Star.</li>
            <li>2. 1v1 matchmaking is strictly enforced for Carrom, Pool, and Ludo Star only — in Kotlin models, TypeScript domain rules, Cloud Functions, and Firestore rules.</li>
            <li>3. Purchased Coins and Practice Points remain strictly separated; zero cash-out, withdrawals, or user-to-user transfers.</li>
            <li>4. Teen Patti is free-play only against offline bots with zero wagering.</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

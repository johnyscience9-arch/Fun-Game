export type GameId =
  | 'level_devil'
  | 'mini_militia'
  | 'carrom'
  | 'teen_patti'
  | 'brick_block'
  | 'pool'
  | 'balloon_shooter'
  | 'archery'
  | 'ludo_star';

export type GameCategory = 'action' | 'board' | 'puzzle' | 'arcade' | 'card';

export interface GameSpec {
  id: GameId;
  order: number;
  titleEn: string;
  titleBn: string;
  genreEn: string;
  genreBn: string;
  category: GameCategory;
  supportsOfflinePractice: boolean;
  supports1v1Match: boolean;
  wageringAllowed: boolean;
  accentHex: string;
  summaryEn: string;
  summaryBn: string;
}

export const MATCH_ELIGIBLE_GAME_IDS: ReadonlySet<GameId> = new Set<GameId>([
  'carrom',
  'pool',
  'ludo_star',
]);

export const GAME_CATALOG: readonly GameSpec[] = [
  {
    id: 'level_devil',
    order: 1,
    titleEn: 'Level Devil',
    titleBn: 'লেভেল ডেভিল',
    genreEn: 'Trap Platformer',
    genreBn: 'ট্র্যাপ প্ল্যাটফর্মার',
    category: 'action',
    supportsOfflinePractice: true,
    supports1v1Match: false,
    wageringAllowed: false,
    accentHex: '#F97316',
    summaryEn: 'Original shifting-floor and spike-trap platformer with offline stage progression.',
    summaryBn: 'অফলাইন স্টেজসহ অরিজিনাল ট্র্যাপ-প্ল্যাটফর্মার গেম।',
  },
  {
    id: 'mini_militia',
    order: 2,
    titleEn: 'Mini Militia',
    titleBn: 'মিনি মিলিশিয়া',
    genreEn: 'Lightweight Arena Shooter',
    genreBn: 'হালকা অ্যারেনা শুটার',
    category: 'action',
    supportsOfflinePractice: true,
    supports1v1Match: false,
    wageringAllowed: false,
    accentHex: '#22C55E',
    summaryEn: 'Jetpack twin-stick survival drills and bot practice tuned for 4GB RAM devices.',
    summaryBn: '৪ জিবি র‍্যাম ডিভাইসের উপযোগী অফলাইন প্র্যাকটিস শুটার।',
  },
  {
    id: 'carrom',
    order: 3,
    titleEn: 'Carrom',
    titleBn: 'ক্যারম',
    genreEn: 'Board & Striker',
    genreBn: 'বোর্ড ও স্ট্রাইকার',
    category: 'board',
    supportsOfflinePractice: true,
    supports1v1Match: true,
    wageringAllowed: false,
    accentHex: '#EAB308',
    summaryEn: 'Precision striker physics with offline bot practice and server-verified 1v1 matches.',
    summaryBn: 'অফলাইন প্র্যাকটিস এবং ১ বনাম ১ ম্যাচ মোডসহ ক্যারম বোর্ড।',
  },
  {
    id: 'teen_patti',
    order: 4,
    titleEn: 'Teen Patti',
    titleBn: 'তিন পাত্তি',
    genreEn: 'Free Card Table (No Wagering)',
    genreBn: 'ফ্রি কার্ড টেবিল (বাজি নিষিদ্ধ)',
    category: 'card',
    supportsOfflinePractice: true,
    supports1v1Match: false,
    wageringAllowed: false,
    accentHex: '#EC4899',
    summaryEn: 'Strictly free-play 3-card classic against AI bots. Zero wagering or cash-out.',
    summaryBn: 'সম্পূর্ণ ফ্রি-প্লে তিন পাত্তি; কোনো বাজি বা অর্থ লেনদেন নেই।',
  },
  {
    id: 'brick_block',
    order: 5,
    titleEn: 'Brick Block',
    titleBn: 'ব্রিক ব্লক',
    genreEn: 'Grid Puzzle',
    genreBn: 'গ্রিড পাজল',
    category: 'puzzle',
    supportsOfflinePractice: true,
    supports1v1Match: false,
    wageringAllowed: false,
    accentHex: '#38BDF8',
    summaryEn: 'Tactile 10x10 block-fitting puzzle with line clears and streak multipliers.',
    summaryBn: 'লাইন ক্লিয়ার ও কম্বোসহ ১০x১০ ব্লক পাজল।',
  },
  {
    id: 'pool',
    order: 6,
    titleEn: 'Pool',
    titleBn: 'পুল',
    genreEn: 'Cue Sports',
    genreBn: 'কিউ স্পোর্টস',
    category: 'board',
    supportsOfflinePractice: true,
    supports1v1Match: true,
    wageringAllowed: false,
    accentHex: '#10B981',
    summaryEn: '8-ball cue physics for offline solo practice and 1v1 friendly matches.',
    summaryBn: 'অফলাইন প্র্যাকটিস ও ১ বনাম ১ ফ্রেন্ডলি ম্যাচসহ ৮-বল পুল।',
  },
  {
    id: 'balloon_shooter',
    order: 7,
    titleEn: 'Balloon Shooter',
    titleBn: 'বেলুন শুটার',
    genreEn: 'Arcade Reflex',
    genreBn: 'আর্কেড রিফ্লেক্স',
    category: 'arcade',
    supportsOfflinePractice: true,
    supports1v1Match: false,
    wageringAllowed: false,
    accentHex: '#F43F5E',
    summaryEn: 'Timed dart-and-combo arcade waves with wind drift and bonus targets.',
    summaryBn: 'সময়সীমা ও বাতাসের গতির সাথে বেলুন শুটিং আর্কেড।',
  },
  {
    id: 'archery',
    order: 8,
    titleEn: 'Archery',
    titleBn: 'আর্চারি',
    genreEn: 'Precision Skill',
    genreBn: 'লক্ষ্যভেদ স্কিল',
    category: 'arcade',
    supportsOfflinePractice: true,
    supports1v1Match: false,
    wageringAllowed: false,
    accentHex: '#A855F7',
    summaryEn: 'Bow-draw tension, wind compensation, and moving bullseye rounds offline.',
    summaryBn: 'বাতাসের দিক হিসাব করে ধনুক ও তীরের নির্ভুল লক্ষ্যভেদ।',
  },
  {
    id: 'ludo_star',
    order: 9,
    titleEn: 'Ludo Star',
    titleBn: 'লুডু স্টার',
    genreEn: 'Classic Dice Board',
    genreBn: 'ক্লাসিক ডাইস বোর্ড',
    category: 'board',
    supportsOfflinePractice: true,
    supports1v1Match: true,
    wageringAllowed: false,
    accentHex: '#3B82F6',
    summaryEn: 'Original Ludo-style token race for offline bots and 1v1 friendly matches.',
    summaryBn: 'অফলাইন বট এবং ১ বনাম ১ ফ্রেন্ডলি ম্যাচসহ অরিজিনাল লুডু।',
  },
] as const;

export function isMatchEligibleGame(gameId: GameId): boolean {
  return MATCH_ELIGIBLE_GAME_IDS.has(gameId);
}

export function getGameById(gameId: GameId): GameSpec {
  const found = GAME_CATALOG.find((g) => g.id === gameId);
  if (!found) {
    throw new Error(`Unknown game id: ${gameId}`);
  }
  return found;
}

import { DifficultyModifiers, ProgressionMeta } from './types';

const STORAGE_KEY = 'adaptive-ai-npc:progression';

// Win this many fights in a row (in a single run) to permanently unlock Counter Stance.
export const UNLOCK_COUNTER_STREAK = 3;

export const DEFAULT_META: ProgressionMeta = {
  bestStreak: 0,
  unlockedCounter: false,
};

export function loadMeta(): ProgressionMeta {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_META };
    const parsed = JSON.parse(raw);
    return {
      bestStreak: typeof parsed.bestStreak === 'number' ? parsed.bestStreak : 0,
      unlockedCounter: !!parsed.unlockedCounter,
    };
  } catch {
    return { ...DEFAULT_META };
  }
}

export function saveMeta(meta: ProgressionMeta) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Storage unavailable (private browsing, etc) — fail silently, progression just won't persist.
  }
}

// Every 2 wins in a streak bumps the difficulty tier, up to a cap.
const MAX_TIER = 5;
const WINS_PER_TIER = 2;

export function getDifficultyForStreak(streak: number): DifficultyModifiers {
  const tier = Math.min(Math.floor(streak / WINS_PER_TIER), MAX_TIER);
  return {
    tier,
    thinkMultiplier: Math.max(0.55, 1 - tier * 0.09), // AI reacts and re-decides faster each tier
    damageMultiplier: 1 + tier * 0.06,                // AI attacks hit a bit harder each tier
    hpBonus: tier * 8,                                // AI gets tougher each tier
  };
}

export function tierLabel(tier: number): string {
  const labels = ['ROOKIE', 'TRAINED', 'VETERAN', 'ELITE', 'APEX', 'S-CLASS'];
  return labels[Math.min(tier, labels.length - 1)];
}

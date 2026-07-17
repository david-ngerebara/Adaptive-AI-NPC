export type ActionType = 
  | 'LIGHT' 
  | 'HEAVY' 
  | 'DODGE' 
  | 'PARRY' 
  | 'HEAL' 
  | 'FEINT' 
  | 'DELAYED'
  | 'COUNTER';

export type EntityStatus = 'IDLE' | 'WINDUP' | 'ACTIVE' | 'RECOVERY' | 'STUNNED';

export type AIMode = 'BALANCED' | 'PATIENT' | 'TRICKY' | 'CAUTIOUS' | 'AGGRESSIVE';

// Run-scoped roguelike perks. Picked one-of-three after each win; wiped on
// loss or on returning to the title screen. See engine/perks.ts.
export type PerkId =
  | 'WIDE_PARRY'
  | 'FAST_HEAL'
  | 'MOMENTUM'
  | 'VAMPIRIC'
  | 'ADRENALINE'
  | 'IRON_SKIN'
  | 'QUICK_HANDS';

export interface PerkDef {
  id: PerkId;
  name: string;
  description: string;
}

// Aggregate effect of every perk currently held, derived fresh each frame
// from GameState.perks — see engine/perks.ts#getPerkModifiers. Kept as
// multipliers/deltas (rather than mutating the base constants) so perks
// never touch the underlying balance for a fresh, perk-less run.
export interface PerkModifiers {
  parryWindowBonusMs: number; // added to PARRY_PERFECT_WINDOW_MS
  healWindupMult: number;     // multiplies ACTIONS.HEAL.windup
  vampiricPct: number;        // fraction of player damage dealt returned as healing
  staminaCostMult: number;    // multiplies STAMINA_COSTS for the player
  damageTakenMult: number;    // multiplies damage the player receives
  cooldownMult: number;       // multiplies Parry/Counter cooldowns when set
  momentum: boolean;          // a clean player Dodge opens a riposte window
}


export interface ActionDef {
  id: ActionType;
  name: string;
  windup: number;
  active: number;
  recovery: number;
  damage: number;
}

export interface EntityState {
  id: 'PLAYER' | 'AI';
  hp: number;
  maxHp: number;
  status: EntityStatus;
  currentAction: ActionType | null;
  timer: number;
  hitProcessed: boolean;
  thinkTimer: number; // Used for AI delay
}

export interface DifficultyModifiers {
  thinkMultiplier: number;  // <1 = AI reacts/attacks faster
  damageMultiplier: number; // >1 = AI hits harder
  hpBonus: number;          // added to AI max HP
  tier: number;             // 0-based difficulty tier, derived from streak
}

export interface CombatLog {
  id: number;
  time: number;
  text: string;
  side: 'PLAYER' | 'AI' | 'SYSTEM';
}

// A floating damage/heal number spawned above a fighter on impact.
export interface DamageNumber {
  id: number;
  side: 'PLAYER' | 'AI';   // which fighter the number floats above (the one hit/healed)
  amount: number;          // always positive; sign is conveyed by isHeal
  isHeal: boolean;
  isCounter: boolean;      // counter-reflect damage gets its own emphasis
  isRiposte: boolean;      // guaranteed punish off a perfect parry gets its own emphasis
  time: number;
}

// Tracks consecutive unanswered hits landed by one side. Resets/flips the
// instant the other side lands a hit back.
export interface ComboState {
  side: 'PLAYER' | 'AI' | null;
  count: number;
}

// Decaying screen-shake impulse. currentMagnitude = magnitude * (timer/duration).
export interface ShakeState {
  magnitude: number;
  timer: number;
  duration: number;
}

export interface GameState {
  status: 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER_WIN' | 'GAME_OVER_LOSE';
  player: EntityState & {
    stamina: number;
    staminaRegenDelay: number; // ms remaining before regen resumes after a spend
    parryCooldown: number;     // ms remaining before Parry can be used again
    counterCooldown: number;   // ms remaining before Counter Stance can be used again
    riposteMs: number;         // ms remaining to commit a punish after a perfect parry
    riposteQueued: boolean;    // true while the in-flight attack is the empowered riposte
  };
  ai: EntityState & { mode: AIMode; stats: any; lockedAction: ActionType | null; difficulty: DifficultyModifiers };
  history: ActionType[];
  logs: CombatLog[];
  brainTimer: number;

  // Perks held for the current run (see PerkId above). Empty on a fresh run;
  // carried forward by useGameEngine when continuing a streak.
  perks: PerkId[];


  // --- Juice / feedback state ---
  hitStopMs: number;         // remaining freeze duration; while >0 the whole sim is paused
  slowMoMs: number;          // remaining slow-motion duration (perfect parry payoff)
  shake: ShakeState;
  damageNumbers: DamageNumber[];
  combo: ComboState;
}

// Persistent progression data, saved across sessions in localStorage.
export interface ProgressionMeta {
  bestStreak: number;
  unlockedCounter: boolean;
}

import { ActionDef, ActionType, GameState } from './types';

// Parry is a timing skill, not a status check: a parry input only fully
// negates and stuns if the incoming hit lands within this opening slice of
// the parry's active window (a "perfect parry"). Landing later than that,
// but still within the active window, downgrades to a "block" — chip
// damage gets through and the attacker isn't stunned, so mashing Parry the
// instant it's off cooldown is no longer a safe, reactive answer to everything.
export const PARRY_PERFECT_WINDOW_MS = 120;

// Fraction of incoming damage removed by a late block (i.e. 1 - this = damage taken).
export const PARRY_BLOCK_DAMAGE_REDUCTION = 0.6;

// Damage reflected onto an attacker whose hit is caught by a successful Counter Stance.
export const COUNTER_DAMAGE = 25;

// --- Player stamina economy ---
// Every player action (except Heal, whose long windup is already its cost) spends
// stamina up front. Spamming drains faster than it regenerates, so mashing one
// button stops being free even before the AI's pattern-lock punishes it.
export const STAMINA_MAX = 100;

export const STAMINA_COSTS: Partial<Record<ActionType, number>> = {
  LIGHT: 12,
  HEAVY: 35,
  DODGE: 15,
  PARRY: 20,
  COUNTER: 25,
  HEAL: 0,
};

export const STAMINA_REGEN_PER_SEC = 22; // stamina/sec once regen is active
export const STAMINA_REGEN_DELAY_MS = 500; // no regen for this long after any spend

// Parry and Counter both get a hard cooldown independent of stamina, so full
// stamina alone doesn't let you alternate between them indefinitely.
export const PARRY_COOLDOWN_MS = 1400;
export const COUNTER_COOLDOWN_MS = 1600;

// --- Hit feedback tuning ("juice") ---
// Hit-stop: brief full-sim freeze on impact so hits register as weight, not
// just a number changing. Heavier/more-significant hits freeze longer.
export const HITSTOP_LIGHT_MS = 55;
export const HITSTOP_HEAVY_MS = 90;
export const HITSTOP_PARRY_MS = 120;
export const HITSTOP_COUNTER_MS = 100;
export const HITSTOP_RIPOSTE_MS = 100;

// Slow-motion window that kicks in the instant a perfect parry lands, so the
// payoff moment reads as distinct from a whiffed or late one.
export const SLOWMO_DURATION_MS = 380;
export const SLOWMO_FACTOR = 0.2; // sim runs at 20% speed during this window

// Screen-shake impulse magnitudes (px) and how long each decays over (ms).
export const SHAKE_LIGHT = { magnitude: 4, duration: 140 };
export const SHAKE_HEAVY = { magnitude: 10, duration: 220 };
export const SHAKE_PARRY = { magnitude: 7, duration: 200 };
export const SHAKE_COUNTER = { magnitude: 11, duration: 240 };
export const SHAKE_RIPOSTE = { magnitude: 11, duration: 240 };

// How long a floating damage number stays alive before being cleaned up.
export const DAMAGE_NUMBER_LIFETIME_MS = 900;

// --- Perfect parry riposte ---
// Landing a perfect parry opens a short window during which the player's
// next Light/Heavy attack is a guaranteed, damage-boosted punish. This is
// what turns "read the timing" into "read the timing -> punish" — the stun
// alone was passive, this makes it an active combo starter.
export const RIPOSTE_WINDOW_MS = 900;   // ms the player has to commit an attack after a perfect parry
export const RIPOSTE_DAMAGE_MULT = 1.75;

export const ACTIONS: Record<ActionType, ActionDef> = {
  LIGHT: { id: 'LIGHT', name: 'Light Attack', windup: 200, active: 100, recovery: 300, damage: 10 },
  HEAVY: { id: 'HEAVY', name: 'Heavy Attack', windup: 600, active: 150, recovery: 400, damage: 30 },
  DODGE: { id: 'DODGE', name: 'Dodge', windup: 0, active: 400, recovery: 200, damage: 0 },
  PARRY: { id: 'PARRY', name: 'Parry', windup: 0, active: 250, recovery: 300, damage: 0 },
  HEAL: { id: 'HEAL', name: 'Heal', windup: 800, active: 100, recovery: 200, damage: -30 }, // negative damage = heal
  COUNTER: { id: 'COUNTER', name: 'Counter Stance', windup: 0, active: 250, recovery: 450, damage: 0 }, // unlockable; long recovery if whiffed

  // AI specific actions
  FEINT: { id: 'FEINT', name: 'Feint', windup: 300, active: 0, recovery: 150, damage: 0 },
  DELAYED: { id: 'DELAYED', name: 'Delayed Strike', windup: 900, active: 100, recovery: 300, damage: 35 },
};

export const INITIAL_STATE: GameState = {
  status: 'MENU',
  player: {
    id: 'PLAYER',
    hp: 100,
    maxHp: 100,
    status: 'IDLE',
    currentAction: null,
    timer: 0,
    hitProcessed: false,
    thinkTimer: 0,
    stamina: STAMINA_MAX,
    staminaRegenDelay: 0,
    parryCooldown: 0,
    counterCooldown: 0,
    riposteMs: 0,
    riposteQueued: false,
  },
  ai: {
    id: 'AI',
    hp: 100,
    maxHp: 100,
    status: 'IDLE',
    currentAction: null,
    timer: 0,
    hitProcessed: false,
    thinkTimer: 500,
    mode: 'BALANCED',
    stats: { dodgeRate: 0, parryRate: 0, heavyRate: 0, healRate: 0 },
    lockedAction: null,
    difficulty: { tier: 0, thinkMultiplier: 1, damageMultiplier: 1, hpBonus: 0 },
  },
  history: [],
  logs: [],
  brainTimer: 0,
  perks: [],
  hitStopMs: 0,
  slowMoMs: 0,
  shake: { magnitude: 0, timer: 0, duration: 0 },
  damageNumbers: [],
  combo: { side: null, count: 0 },
};

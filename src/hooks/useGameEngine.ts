import { useEffect, useRef, useState, useCallback } from 'react';
import { INITIAL_STATE, STAMINA_COSTS, STAMINA_REGEN_DELAY_MS, PARRY_COOLDOWN_MS, COUNTER_COOLDOWN_MS } from '../engine/constants';
import { advanceFrame } from '../engine/engine';
import { ActionType, GameState, PerkDef, PerkId, ProgressionMeta } from '../engine/types';
import { loadMeta, saveMeta, getDifficultyForStreak, UNLOCK_COUNTER_STREAK } from '../engine/progression';
import { getPerkModifiers, rollPerkChoices } from '../engine/perks';

export function useGameEngine() {
  const stateRef = useRef<GameState>(JSON.parse(JSON.stringify(INITIAL_STATE)));
  const [, setRenderTick] = useState(0);

  // Progression: how many wins in a row on the *current* run, persisted best-ever
  // streak, and whether Counter Stance has been permanently unlocked.
  const streakRef = useRef(0);
  const metaRef = useRef<ProgressionMeta>(loadMeta());
  const resultHandledRef = useRef(false);
  // True for the single run in which the unlock threshold was just crossed,
  // so the UI can show a one-time "unlocked!" banner on that win screen.
  const justUnlockedRef = useRef(false);

  // Perks held for the *current run* (wiped on loss / fresh start — see
  // startGame and resetToMenu below). perkChoicesRef holds the 3 options
  // rolled for the win screen currently on display, generated once per win
  // so re-renders don't reshuffle the cards under the player.
  const perksRef = useRef<PerkId[]>([]);
  const perkChoicesRef = useRef<PerkDef[]>([]);

  useEffect(() => {
    let lastTime = performance.now();
    let frameId: number;
    let isRunning = true;

    const loop = (time: number) => {
      if (!isRunning) return;
      const delta = Math.min(time - lastTime, 100); // Cap delta to prevent huge jumps
      lastTime = time;
      
      // advanceFrame is a no-op unless status === 'PLAYING', so this
      // naturally freezes everything while PAUSED, MENU, or GAME_OVER.
      advanceFrame(stateRef.current, delta);

      const s = stateRef.current;
      if (!resultHandledRef.current && (s.status === 'GAME_OVER_WIN' || s.status === 'GAME_OVER_LOSE')) {
        resultHandledRef.current = true;
        if (s.status === 'GAME_OVER_WIN') {
          streakRef.current += 1;
          let changed = false;
          if (streakRef.current > metaRef.current.bestStreak) {
            metaRef.current.bestStreak = streakRef.current;
            changed = true;
          }
          if (!metaRef.current.unlockedCounter && streakRef.current >= UNLOCK_COUNTER_STREAK) {
            metaRef.current.unlockedCounter = true;
            justUnlockedRef.current = true;
            changed = true;
          }
          if (changed) saveMeta(metaRef.current);
          perkChoicesRef.current = rollPerkChoices(perksRef.current, 3);
        } else {
          streakRef.current = 0;
          perksRef.current = [];
        }
      }

      setRenderTick(t => (t + 1) % 10000);
      
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      cancelAnimationFrame(frameId);
    };
  }, []);

  const dispatchPlayerAction = useCallback((action: ActionType) => {
    const s = stateRef.current;
    if (s.status !== 'PLAYING') return;
    if (action === 'COUNTER' && !metaRef.current.unlockedCounter) return;
    
    const p = s.player;
    if (p.status !== 'IDLE') return;

    const mods = getPerkModifiers(s.perks);
    const cost = Math.round((STAMINA_COSTS[action] ?? 0) * mods.staminaCostMult);
    if (p.stamina < cost) return; // not enough stamina to commit to this action
    if (action === 'PARRY' && p.parryCooldown > 0) return;
    if (action === 'COUNTER' && p.counterCooldown > 0) return;

    p.status = 'WINDUP';
    p.currentAction = action;
    p.timer = 0;
    p.hitProcessed = false;

    p.stamina = Math.max(0, p.stamina - cost);
    if (cost > 0) p.staminaRegenDelay = STAMINA_REGEN_DELAY_MS;
    if (action === 'PARRY') p.parryCooldown = Math.round(PARRY_COOLDOWN_MS * mods.cooldownMult);
    if (action === 'COUNTER') p.counterCooldown = Math.round(COUNTER_COOLDOWN_MS * mods.cooldownMult);

    // Committing an attack while a riposte window is open spends it — the
    // window rewards a fast follow-up, not a buff that lingers through
    // multiple swings.
    if ((action === 'LIGHT' || action === 'HEAVY') && p.riposteMs > 0) {
      p.riposteQueued = true;
      p.riposteMs = 0;
    } else {
      p.riposteQueued = false;
    }

    s.history.push(action);
    if (s.history.length > 20) s.history.shift();
  }, []);

  // continuing=true keeps the current streak (used when pressing "Continue Streak"
  // after a win); continuing=false starts a fresh run at streak 0 (fresh start, or
  // restarting after a loss).
  const startGame = useCallback((continuing: boolean = false) => {
    if (!continuing) {
      streakRef.current = 0;
      perksRef.current = [];
    }
    resultHandledRef.current = false;
    justUnlockedRef.current = false;
    perkChoicesRef.current = [];

    const fresh: GameState = JSON.parse(JSON.stringify(INITIAL_STATE));
    fresh.ai.difficulty = getDifficultyForStreak(streakRef.current);
    fresh.ai.maxHp = 100 + fresh.ai.difficulty.hpBonus;
    fresh.ai.hp = fresh.ai.maxHp;
    fresh.status = 'PLAYING';
    fresh.perks = [...perksRef.current];

    stateRef.current = fresh;
    setRenderTick(t => (t + 1) % 10000);
  }, []);

  // Called when the player picks a card on the post-win perk screen. Adds
  // the perk to the run and immediately starts the next fight with it
  // active — there's no separate "confirm" step.
  const choosePerk = useCallback((id: PerkId) => {
    if (!perksRef.current.includes(id)) {
      perksRef.current = [...perksRef.current, id];
    }
    startGame(true);
  }, [startGame]);

  const pauseGame = useCallback(() => {
    if (stateRef.current.status === 'PLAYING') {
      stateRef.current.status = 'PAUSED';
      setRenderTick(t => (t + 1) % 10000);
    }
  }, []);

  const resumeGame = useCallback(() => {
    if (stateRef.current.status === 'PAUSED') {
      stateRef.current.status = 'PLAYING';
      setRenderTick(t => (t + 1) % 10000);
    }
  }, []);

  const resetToMenu = useCallback(() => {
    streakRef.current = 0;
    perksRef.current = [];
    perkChoicesRef.current = [];
    stateRef.current = JSON.parse(JSON.stringify(INITIAL_STATE));
    setRenderTick(t => (t + 1) % 10000);
  }, []);

  return {
    state: stateRef.current,
    dispatchPlayerAction,
    startGame,
    pauseGame,
    resumeGame,
    resetToMenu,
    streak: streakRef.current,
    bestStreak: metaRef.current.bestStreak,
    unlockedCounter: metaRef.current.unlockedCounter,
    justUnlockedCounter: justUnlockedRef.current,
    perks: perksRef.current,
    perkChoices: perkChoicesRef.current,
    choosePerk,
  };
}

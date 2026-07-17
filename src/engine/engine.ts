import {
  ACTIONS, COUNTER_DAMAGE, PARRY_PERFECT_WINDOW_MS, PARRY_BLOCK_DAMAGE_REDUCTION,
  STAMINA_MAX, STAMINA_REGEN_PER_SEC,
  HITSTOP_LIGHT_MS, HITSTOP_HEAVY_MS, HITSTOP_PARRY_MS, HITSTOP_COUNTER_MS, HITSTOP_RIPOSTE_MS,
  SLOWMO_DURATION_MS, SLOWMO_FACTOR,
  SHAKE_LIGHT, SHAKE_HEAVY, SHAKE_PARRY, SHAKE_COUNTER, SHAKE_RIPOSTE,
  DAMAGE_NUMBER_LIFETIME_MS, RIPOSTE_WINDOW_MS, RIPOSTE_DAMAGE_MULT,
} from './constants';
import { GameState, EntityState, ActionType, AIMode, PerkModifiers } from './types';
import { getPerkModifiers } from './perks';

function addLog(state: GameState, text: string, side: 'PLAYER' | 'AI' | 'SYSTEM') {
  state.logs.push({ id: Math.random(), time: Date.now(), text, side });
}

// --- Juice helpers ---

function triggerHitStop(state: GameState, ms: number) {
  // Take the stronger of an already-running freeze rather than stacking,
  // so two near-simultaneous triggers don't create an absurdly long stall.
  state.hitStopMs = Math.max(state.hitStopMs, ms);
}

function triggerShake(state: GameState, impulse: { magnitude: number; duration: number }) {
  state.shake = { magnitude: impulse.magnitude, timer: impulse.duration, duration: impulse.duration };
}

function triggerSlowMo(state: GameState, ms: number) {
  state.slowMoMs = Math.max(state.slowMoMs, ms);
}

function spawnDamageNumber(state: GameState, side: 'PLAYER' | 'AI', amount: number, isHeal: boolean, isCounter: boolean = false, isRiposte: boolean = false) {
  state.damageNumbers.push({ id: Math.random(), side, amount: Math.round(amount), isHeal, isCounter, isRiposte, time: Date.now() });
}

// A landed hit either extends the current side's combo or, if the other
// side was "on a heater," answers it — flipping the combo over to a fresh
// count of 1 for whoever just connected.
function registerComboHit(state: GameState, side: 'PLAYER' | 'AI') {
  if (state.combo.side === side) {
    state.combo.count += 1;
  } else {
    state.combo.side = side;
    state.combo.count = 1;
  }
}

function breakCombo(state: GameState) {
  state.combo = { side: null, count: 0 };
}

export function advanceFrame(state: GameState, delta: number) {
  if (state.status !== 'PLAYING') return;

  // Screen shake decays in real time regardless of hit-stop/slow-mo below.
  if (state.shake.timer > 0) {
    state.shake.timer = Math.max(0, state.shake.timer - delta);
  }

  // Hit-stop: a brief total freeze on impactful moments. Nothing else in
  // the sim advances this frame, including AI thinking and stamina regen —
  // that's what makes it read as "the world paused," not just a slowdown.
  if (state.hitStopMs > 0) {
    state.hitStopMs = Math.max(0, state.hitStopMs - delta);
    return;
  }

  // Slow-motion payoff window (perfect parry). Decrement in real time but
  // feed a scaled-down delta to everything that actually simulates motion.
  let simDelta = delta;
  if (state.slowMoMs > 0) {
    state.slowMoMs = Math.max(0, state.slowMoMs - delta);
    simDelta = delta * SLOWMO_FACTOR;
  }

  // Recomputed each frame from the current perk list (cheap, tiny array) —
  // see PerkModifiers in types.ts for what each field does.
  const mods = getPerkModifiers(state.perks);

  // Process Entities
  processEntity(state.player, state.ai, state, simDelta, mods);
  processEntity(state.ai, state.player, state, simDelta, mods);

  // Stamina regen + cooldown ticking (player only — see STAMINA_COSTS comment)
  processPlayerResources(state.player, simDelta);

  // Process AI Logic
  processAILogic(state, simDelta);

  // Win/Loss
  if (state.player.hp <= 0 && state.status === 'PLAYING') {
    state.player.hp = 0;
    state.status = 'GAME_OVER_LOSE';
    addLog(state, 'Simulation Failed. Subject Terminated.', 'SYSTEM');
  }
  if (state.ai.hp <= 0 && state.status === 'PLAYING') {
    state.ai.hp = 0;
    state.status = 'GAME_OVER_WIN';
    addLog(state, 'Simulation Complete. Target Neutralized.', 'SYSTEM');
  }
  
  // Cleanup old logs
  const now = Date.now();
  state.logs = state.logs.filter(l => now - l.time < 3000);
  state.damageNumbers = state.damageNumbers.filter(d => now - d.time < DAMAGE_NUMBER_LIFETIME_MS);
}

function processEntity(entity: EntityState, target: EntityState, state: GameState, delta: number, mods: PerkModifiers) {
  if (entity.status === 'IDLE') return;

  entity.timer += delta;
  const actionDef = ACTIONS[entity.currentAction!];
  // Only the AI entity carries a difficulty modifier; players always hit at 1x.
  const damageMultiplier = (entity as any).difficulty?.damageMultiplier ?? 1;
  // Second Wind (FAST_HEAL) only ever applies to the player's own heal windup.
  const effectiveWindup = (entity.id === 'PLAYER' && entity.currentAction === 'HEAL')
    ? actionDef.windup * mods.healWindupMult
    : actionDef.windup;

  if (entity.status === 'WINDUP') {
    if (entity.timer >= effectiveWindup) {
      entity.status = 'ACTIVE';
      entity.timer = 0;
      entity.hitProcessed = false;
      
      if (entity.currentAction === 'FEINT') {
        addLog(state, `${entity.id} feints!`, entity.id);
      }
    }
  } else if (entity.status === 'ACTIVE') {
    if (actionDef.damage !== 0 && !entity.hitProcessed) {
      if (actionDef.damage < 0) {
        // Heal
        const healAmount = -actionDef.damage;
        entity.hp = Math.min(entity.maxHp, entity.hp - actionDef.damage);
        entity.hitProcessed = true;
        addLog(state, `${entity.id} heals!`, entity.id);
        spawnDamageNumber(state, entity.id as 'PLAYER' | 'AI', healAmount, true);
      } else {
        // Attack
        const isRiposte = entity.id === 'PLAYER' && (entity as any).riposteQueued;
        let hit = true;
        let blocked = false;
        // A queued riposte is a guaranteed punish — it bypasses the AI's
        // dodge/parry/counter entirely rather than just hitting harder.
        // In practice the AI is almost always still STUNNED from the
        // perfect parry that opened this window, so this mostly guards
        // the edge case where the player's attack lands right as the
        // stun wears off.
        if (isRiposte) {
          // no-op: hit stays true, blocked stays false
        } else if (target.status === 'ACTIVE' && target.currentAction === 'DODGE') {
          hit = false;
          addLog(state, `${target.id} evaded!`, target.id);
          // Momentum: a clean dodge is treated as its own skill payoff,
          // opening the same riposte window a perfect parry would.
          if (target.id === 'PLAYER' && mods.momentum) {
            (state.player as any).riposteMs = RIPOSTE_WINDOW_MS;
            addLog(state, 'Momentum! Riposte window open!', 'SYSTEM');
          }
        } else if (target.status === 'ACTIVE' && target.currentAction === 'PARRY') {
          // Timing skill, not a status check: only a hit that lands within the
          // opening slice of the parry's active window counts as a perfect
          // parry. target.timer is how long the parry has been ACTIVE, so a
          // late (but still active) parry only downgrades to a block.
          const perfectWindow = PARRY_PERFECT_WINDOW_MS + (target.id === 'PLAYER' ? mods.parryWindowBonusMs : 0);
          if (target.timer <= perfectWindow) {
            hit = false;
            entity.status = 'STUNNED';
            entity.timer = 0;
            addLog(state, `${target.id} perfect parries!`, target.id);
            // This is the moment the whole parry mechanic is built around —
            // give it its own distinct freeze/slow-mo/shake signature so it
            // never reads the same as a whiffed or late (block) parry.
            triggerHitStop(state, HITSTOP_PARRY_MS);
            triggerSlowMo(state, SLOWMO_DURATION_MS);
            triggerShake(state, SHAKE_PARRY);
            breakCombo(state);
            // Only the player gets the riposte payoff — the AI already
            // reacts algorithmically and doesn't need a skill reward.
            if (target.id === 'PLAYER') {
              (state.player as any).riposteMs = RIPOSTE_WINDOW_MS;
              addLog(state, 'Riposte window open!', 'SYSTEM');
            }
          } else {
            blocked = true;
            addLog(state, `${target.id} blocks!`, target.id);
          }
        } else if (target.status === 'ACTIVE' && target.currentAction === 'COUNTER') {
          // Counter Stance: negate the hit and reflect heavy damage, stunning the attacker.
          hit = false;
          entity.hp = Math.max(0, entity.hp - COUNTER_DAMAGE);
          entity.status = 'STUNNED';
          entity.timer = 0;
          addLog(state, `${target.id} counters for ${COUNTER_DAMAGE}!`, target.id);
          spawnDamageNumber(state, entity.id as 'PLAYER' | 'AI', COUNTER_DAMAGE, false, true);
          triggerHitStop(state, HITSTOP_COUNTER_MS);
          triggerShake(state, SHAKE_COUNTER);
          // The counter is the target's answer — it flips the combo to them.
          registerComboHit(state, target.id as 'PLAYER' | 'AI');
        }

        if (hit) {
          let dmg = Math.round(actionDef.damage * damageMultiplier);
          if (blocked) dmg = Math.max(1, Math.round(dmg * (1 - PARRY_BLOCK_DAMAGE_REDUCTION)));
          if (isRiposte) dmg = Math.round(dmg * RIPOSTE_DAMAGE_MULT);
          // Iron Skin only ever softens damage landing on the player.
          if (target.id === 'PLAYER' && mods.damageTakenMult !== 1) {
            dmg = Math.max(1, Math.round(dmg * mods.damageTakenMult));
          }
          target.hp -= dmg;
          addLog(state, isRiposte ? `${entity.id} lands a RIPOSTE for ${dmg}!` : `${entity.id} hits for ${dmg}!`, entity.id);
          spawnDamageNumber(state, target.id as 'PLAYER' | 'AI', dmg, false, false, isRiposte);
          registerComboHit(state, entity.id as 'PLAYER' | 'AI');

          const isHeavyHit = entity.currentAction === 'HEAVY' || entity.currentAction === 'DELAYED';
          triggerHitStop(state, isRiposte ? HITSTOP_RIPOSTE_MS : isHeavyHit ? HITSTOP_HEAVY_MS : HITSTOP_LIGHT_MS);
          triggerShake(state, isRiposte ? SHAKE_RIPOSTE : isHeavyHit ? SHAKE_HEAVY : SHAKE_LIGHT);

          // Vampiric Strikes: only the player's own landed hits give life back.
          if (entity.id === 'PLAYER' && mods.vampiricPct > 0) {
            const healAmt = dmg * mods.vampiricPct;
            entity.hp = Math.min(entity.maxHp, entity.hp + healAmt);
            spawnDamageNumber(state, 'PLAYER', healAmt, true);
          }
        }
        if (isRiposte) (entity as any).riposteQueued = false;
        entity.hitProcessed = true;
      }
    }

    if (entity.status !== 'STUNNED' && entity.timer >= actionDef.active) {
      entity.status = 'RECOVERY';
      entity.timer = 0;
    }
  } else if (entity.status === 'RECOVERY') {
    if (entity.timer >= actionDef.recovery) {
      entity.status = 'IDLE';
      entity.timer = 0;
    }
  } else if (entity.status === 'STUNNED') {
    if (entity.timer >= 1200) { // 1.2 sec stun
      entity.status = 'IDLE';
      entity.timer = 0;
    }
  }
}

function processPlayerResources(player: GameState['player'], delta: number) {
  if (player.parryCooldown > 0) {
    player.parryCooldown = Math.max(0, player.parryCooldown - delta);
  }
  if (player.counterCooldown > 0) {
    player.counterCooldown = Math.max(0, player.counterCooldown - delta);
  }
  if (player.riposteMs > 0) {
    player.riposteMs = Math.max(0, player.riposteMs - delta);
  }

  if (player.staminaRegenDelay > 0) {
    player.staminaRegenDelay = Math.max(0, player.staminaRegenDelay - delta);
  } else if (player.stamina < STAMINA_MAX) {
    player.stamina = Math.min(STAMINA_MAX, player.stamina + (STAMINA_REGEN_PER_SEC / 1000) * delta);
  }
}

function processAILogic(state: GameState, delta: number) {
  const ai = state.ai;
  const player = state.player;

  // 0. Pattern recognition: two identical player actions in a row locks
  // the AI onto a hard counter for that specific move. This is instant
  // (not gated by the 1s brain tick) so spamming one button gets punished
  // right away instead of after a slow rolling-average threshold.
  updateLockedAction(state);

  // 1. Brain Analysis tick
  state.brainTimer += delta;
  if (state.brainTimer >= 1000) {
    state.brainTimer = 0;
    updateAIBrain(state);
  }

  // 2. Action Selection
  if (ai.status === 'IDLE') {
    ai.thinkTimer -= delta;
    if (ai.thinkTimer <= 0) {
      const nextAction = chooseAIAction(state);
      if (nextAction !== null) {
        ai.status = 'WINDUP';
        ai.currentAction = nextAction;
        ai.timer = 0;
      }
      // Reset thinking delay, scaled by the current difficulty tier so higher
      // streaks make the AI re-decide (and thus react) noticeably faster.
      const thinkMult = ai.difficulty?.thinkMultiplier ?? 1;
      ai.thinkTimer = (150 + Math.random() * 200) * thinkMult;
    }
  }
}

function updateLockedAction(state: GameState) {
  const h = state.history;
  if (h.length < 2) return;

  const last = h[h.length - 1];
  const prev = h[h.length - 2];

  // Two of the same action back-to-back = the AI has "read" the pattern.
  // This overwrites any previous lock, so two-in-a-row of a *different*
  // move is exactly what breaks an old lock and establishes a new one.
  if (last === prev && state.ai.lockedAction !== last) {
    state.ai.lockedAction = last;
    addLog(state, `AI reads your ${ACTIONS[last].name} pattern!`, 'SYSTEM');
  }
}

function updateAIBrain(state: GameState) {
  const history = state.history;
  if (history.length < 5) return;

  let dodges = 0, parries = 0, heavies = 0, heals = 0;
  history.forEach(a => {
    if (a === 'DODGE') dodges++;
    if (a === 'PARRY') parries++;
    if (a === 'HEAVY') heavies++;
    if (a === 'HEAL') heals++;
  });

  const total = history.length;
  const dodgeRate = dodges / total;
  const parryRate = parries / total;
  const heavyRate = heavies / total;
  const healRate = heals / total;

  let newMode: AIMode = 'BALANCED';
  
  // Rule-based override hierarchy based on threat level of player spam
  if (dodgeRate >= 0.25) newMode = 'PATIENT';
  else if (parryRate >= 0.25) newMode = 'TRICKY';
  else if (healRate >= 0.15) newMode = 'AGGRESSIVE';
  else if (heavyRate >= 0.25) newMode = 'CAUTIOUS';

  state.ai.mode = newMode;
  state.ai.stats = { dodgeRate, parryRate, heavyRate, healRate };
}

function chooseAIAction(state: GameState): ActionType | null {
  const mode = state.ai.mode;
  const p = state.player;
  const locked = state.ai.lockedAction;

  // Hard counter: the AI has read a repeated 2x pattern and reacts to it
  // with certainty, overriding the slower rate-based mode logic below.
  if (locked) {
    if (p.status === 'WINDUP' && p.currentAction === locked) {
      if (locked === 'HEAVY') return 'DODGE';
      if (locked === 'LIGHT') return 'PARRY';
      if (locked === 'HEAL') return 'LIGHT'; // punish the long heal windup
    }
    // DODGE/PARRY have zero windup, so there's no windup frame to react
    // to - counter them at the point they actually become exploitable instead.
    if (locked === 'DODGE' && p.status === 'ACTIVE' && p.currentAction === 'DODGE') {
      return 'DELAYED';
    }
    if (locked === 'PARRY' && p.status === 'IDLE') {
      // Bait with feints instead of throwing real attacks into a parry-happy player
      return Math.random() > 0.4 ? 'FEINT' : 'LIGHT';
    }
  }

  // Defensive overrides (Reactive to current state)
  if (p.status === 'WINDUP' && p.currentAction === 'HEAVY') {
    if (mode === 'CAUTIOUS') return 'DODGE';
    if (mode === 'TRICKY' || mode === 'BALANCED') return 'PARRY';
  }
  
  if (p.status === 'WINDUP' && p.currentAction === 'LIGHT' && mode === 'CAUTIOUS') {
    return 'DODGE';
  }

  // Strategic choices based on Mode
  if (mode === 'PATIENT') {
    if (p.status === 'ACTIVE' && p.currentAction === 'DODGE') return 'DELAYED';
    return null; // Wait
  }
  
  if (mode === 'TRICKY') {
    // 50% chance to feint when attacking
    return Math.random() > 0.5 ? 'FEINT' : 'HEAVY';
  }
  
  if (mode === 'AGGRESSIVE') {
    // Relentless light attacks to prevent healing
    return 'LIGHT';
  }
  
  if (mode === 'CAUTIOUS') {
    // Wait for player to act, occasional light attacks
    return Math.random() > 0.7 ? 'LIGHT' : null;
  }

  // BALANCED
  const rand = Math.random();
  if (rand > 0.7) return 'LIGHT';
  if (rand > 0.9) return 'HEAVY';
  if (rand > 0.95) return 'DODGE';
  return null;
}

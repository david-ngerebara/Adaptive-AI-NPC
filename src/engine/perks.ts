import { PerkDef, PerkId, PerkModifiers } from './types';

// A light roguelike layer on top of the existing streak system: after every
// win the player picks one of three perks for the *current run only* (see
// PerkModifiers below for how each one actually changes engine behavior).
// A loss — or backing out to the title screen — wipes the run's perks, so
// the ceiling stays skill-based rather than a permanent power creep.
export const PERK_POOL: PerkDef[] = [
  {
    id: 'WIDE_PARRY',
    name: 'Reflexes',
    description: 'Perfect parry window widened by 80ms.',
  },
  {
    id: 'FAST_HEAL',
    name: 'Second Wind',
    description: 'Heal windup cut in half.',
  },
  {
    id: 'MOMENTUM',
    name: 'Momentum',
    description: 'A clean Dodge opens a riposte window, just like a perfect parry.',
  },
  {
    id: 'VAMPIRIC',
    name: 'Vampiric Strikes',
    description: 'Landed attacks heal you for 20% of the damage dealt.',
  },
  {
    id: 'ADRENALINE',
    name: 'Adrenaline',
    description: 'All stamina costs reduced by 20%.',
  },
  {
    id: 'IRON_SKIN',
    name: 'Iron Skin',
    description: 'Incoming damage reduced by 15%.',
  },
  {
    id: 'QUICK_HANDS',
    name: 'Quick Hands',
    description: 'Parry and Counter Stance cooldowns reduced by 30%.',
  },
];

export function getPerkDef(id: PerkId): PerkDef {
  return PERK_POOL.find(p => p.id === id)!;
}

// Perks are additive/stacking by design (e.g. picking Reflexes twice across
// runs never happens since a perk is removed from the pool once taken for
// that run — but the math supports stacking cleanly if that ever changes).
export function getPerkModifiers(perks: PerkId[]): PerkModifiers {
  const mods: PerkModifiers = {
    parryWindowBonusMs: 0,
    healWindupMult: 1,
    vampiricPct: 0,
    staminaCostMult: 1,
    damageTakenMult: 1,
    cooldownMult: 1,
    momentum: false,
  };

  for (const id of perks) {
    switch (id) {
      case 'WIDE_PARRY':
        mods.parryWindowBonusMs += 80;
        break;
      case 'FAST_HEAL':
        mods.healWindupMult *= 0.5;
        break;
      case 'MOMENTUM':
        mods.momentum = true;
        break;
      case 'VAMPIRIC':
        mods.vampiricPct += 0.2;
        break;
      case 'ADRENALINE':
        mods.staminaCostMult *= 0.8;
        break;
      case 'IRON_SKIN':
        mods.damageTakenMult *= 0.85;
        break;
      case 'QUICK_HANDS':
        mods.cooldownMult *= 0.7;
        break;
    }
  }

  return mods;
}

// Picks `count` perks the player doesn't already have this run. If the pool
// has run dry (more picks than perks exist), just return whatever's left.
export function rollPerkChoices(ownedIds: PerkId[], count: number = 3): PerkDef[] {
  const available = PERK_POOL.filter(p => !ownedIds.includes(p.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

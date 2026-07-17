import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EntityState, CombatLog, GameState, DamageNumber } from '../engine/types';
import { ACTIONS, STAMINA_MAX } from '../engine/constants';
import { tierLabel } from '../engine/progression';
import { Zap, Flame, Swords } from 'lucide-react';

interface ArenaProps {
  state: GameState;
}

const variants = {
  PLAYER: {
    IDLE: { x: 0, scale: 1, filter: 'brightness(1)' },
    WINDUP: { x: -30, scale: 1.05, filter: 'brightness(1.2)' },
    ACTIVE: { x: 120, scale: 1.1, filter: 'brightness(1.5)', transition: { duration: 0.1 } },
    RECOVERY: { x: 0, scale: 1, transition: { duration: 0.3 } },
    DODGING: { x: -60, y: -20, opacity: 0.6 },
    PARRYING: { scale: 1.1 },
    COUNTERING: { scale: 1.15, filter: 'brightness(1.3)' },
    STUNNED: { x: [-5, 5, -5, 5, 0], filter: 'grayscale(1)', transition: { repeat: Infinity, duration: 0.1 } }
  },
  AI: {
    IDLE: { x: 0, scale: 1, filter: 'brightness(1)' },
    WINDUP: { x: 30, scale: 1.05, filter: 'brightness(1.2)' },
    ACTIVE: { x: -120, scale: 1.1, filter: 'brightness(1.5)', transition: { duration: 0.1 } },
    RECOVERY: { x: 0, scale: 1, transition: { duration: 0.3 } },
    DODGING: { x: 60, y: -20, opacity: 0.6 },
    PARRYING: { scale: 1.1 },
    COUNTERING: { scale: 1.15, filter: 'brightness(1.3)' },
    STUNNED: { x: [-5, 5, -5, 5, 0], filter: 'grayscale(1)', transition: { repeat: Infinity, duration: 0.1 } }
  }
};

// Maps an entity's current status/action to the pose sprite that should be
// displayed. Falls back to the neutral idle sprite whenever no specific
// action pose applies.
function getPoseSprite(entity: EntityState): string {
  if (entity.status === 'STUNNED') return '/sprites/BLOCK.png';

  if (entity.status === 'WINDUP' || entity.status === 'ACTIVE') {
    switch (entity.currentAction) {
      case 'LIGHT':
        return '/sprites/LIGHT.png';
      case 'HEAVY':
      case 'DELAYED':
      case 'FEINT':
        return '/sprites/HEAVY.png';
      case 'DODGE':
        return '/sprites/DODGE.png';
      case 'PARRY':
      case 'COUNTER':
        return '/sprites/BLOCK.png';
    }
  }

  return '/sprites/IDLE.png';
}

export const Arena: React.FC<ArenaProps> = ({ state }) => {
  const { player, ai, logs, shake, damageNumbers, combo } = state;

  // Screen shake: a decaying random jitter recomputed every render (the
  // engine ticks this component every animation frame, so a fresh random
  // offset each frame reads as a genuine shake rather than a single nudge).
  const shakeMag = shake.duration > 0 ? shake.magnitude * (shake.timer / shake.duration) : 0;
  const shakeX = shakeMag > 0.1 ? (Math.random() - 0.5) * 2 * shakeMag : 0;
  const shakeY = shakeMag > 0.1 ? (Math.random() - 0.5) * 2 * shakeMag : 0;

  const playerDamageNumbers = damageNumbers.filter(d => d.side === 'PLAYER');
  const aiDamageNumbers = damageNumbers.filter(d => d.side === 'AI');

  return (
    <div
      className="relative w-full h-full bg-[#0D0D0D] overflow-hidden flex flex-col justify-between"
      style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}
    >
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Health Bars */}
      <div className="flex justify-between p-6 relative z-10">
        <HealthBar entity={player} color="bg-[#3366FF]" name="TEST SUBJECT" stamina={player.stamina} maxStamina={STAMINA_MAX} />
        <HealthBar entity={ai} color="bg-[#FF0055]" name="ADAPTIVE AI" subLabel={`TIER: ${tierLabel(ai.difficulty?.tier ?? 0)}`} />
      </div>

      {/* Combo banner */}
      <AnimatePresence>
        {combo.side && combo.count >= 2 && (
          <motion.div
            key={`${combo.side}-${combo.count}`}
            initial={{ opacity: 0, y: -10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-1.5 bg-black/80 border font-mono tracking-[0.2em] uppercase text-sm font-black ${
              combo.side === 'PLAYER' ? 'border-[#3366FF] text-[#3366FF]' : 'border-[#FF0055] text-[#FF0055]'
            }`}
          >
            <Flame className="w-4 h-4" />
            {combo.count} HIT COMBO
          </motion.div>
        )}
      </AnimatePresence>

      {/* Riposte window banner — the payoff moment for a perfect parry */}
      <AnimatePresence>
        {player.riposteMs > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: [1, 1.06, 1] }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ scale: { duration: 0.4, repeat: Infinity } }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-1.5 bg-black/80 border border-[#FFD400] text-[#FFD400] font-mono tracking-[0.2em] uppercase text-sm font-black shadow-[0_0_20px_rgba(255,212,0,0.4)]"
          >
            <Swords className="w-4 h-4" />
            RIPOSTE READY — ATTACK NOW
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combat Arena Stage */}
      <div className="flex-1 flex items-center justify-between px-24 relative z-10">
        <Fighter entity={player} align="left" damageNumbers={playerDamageNumbers} riposteReady={player.riposteMs > 0} />
        <Fighter entity={ai} align="right" damageNumbers={aiDamageNumbers} />
        
        {/* Floating Logs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none gap-2">
          {logs.slice(-4).map(log => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`text-sm font-bold tracking-widest uppercase px-3 py-1 bg-black/80 border border-[#333] ${
                log.side === 'PLAYER' ? 'text-[#3366FF]' : log.side === 'AI' ? 'text-[#FF0055]' : 'text-[#888]'
              }`}
            >
              {log.text}
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Floor */}
      <div className="h-16 w-full bg-gradient-to-t from-[#0A0A0A] to-transparent absolute bottom-0 pointer-events-none" />
    </div>
  );
};

const HealthBar = ({ entity, color, name, subLabel, stamina, maxStamina }: { entity: EntityState, color: string, name: string, subLabel?: string, stamina?: number, maxStamina?: number }) => {
  const pct = Math.max(0, Math.min(100, (entity.hp / entity.maxHp) * 100));
  const staminaPct = typeof stamina === 'number' && maxStamina ? Math.max(0, Math.min(100, (stamina / maxStamina) * 100)) : null;
  return (
    <div className="w-64">
      <div className="flex justify-between text-xs font-black tracking-widest uppercase text-[#888] mb-2">
        <span>{name}{subLabel ? <span className="text-[#FF0055] ml-2">{subLabel}</span> : null}</span>
        <span>{Math.floor(entity.hp)} / {entity.maxHp}</span>
      </div>
      <div className="h-4 bg-[#1A1A1A] overflow-hidden border border-[#333]">
        <motion.div
          className={`h-full ${color}`}
          initial={{ width: '100%' }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
        />
      </div>

      {/* Stamina sub-bar (player only) */}
      {staminaPct !== null && (
        <div className="mt-1.5 h-1.5 bg-[#1A1A1A] overflow-hidden border border-[#333]">
          <motion.div
            className={`h-full ${staminaPct < 25 ? 'bg-[#FF0055]' : 'bg-[#FFD400]'}`}
            animate={{ width: `${staminaPct}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>
      )}

      {/* Status indicator */}
      <div className="mt-2 text-[10px] uppercase font-mono tracking-widest text-[#666] h-4">
        {entity.status !== 'IDLE' ? `${entity.status} ${entity.currentAction ? `- ${ACTIONS[entity.currentAction].name}` : ''}` : ''}
      </div>
    </div>
  );
}

const Fighter = ({ entity, align, damageNumbers, riposteReady = false }: { entity: EntityState, align: 'left' | 'right', damageNumbers: DamageNumber[], riposteReady?: boolean }) => {
  const isLeft = align === 'left';
  let variantState = entity.status as keyof typeof variants.PLAYER;

  if (entity.status === 'ACTIVE' || entity.status === 'WINDUP') {
    if (entity.currentAction === 'DODGE') variantState = 'DODGING';
    if (entity.currentAction === 'PARRY') variantState = 'PARRYING';
    if (entity.currentAction === 'COUNTER') variantState = 'COUNTERING';
  }

  const teamColor = isLeft ? '#3366FF' : '#FF0055';
  const poseSrc = getPoseSprite(entity);
  const isParryFlash = entity.status === 'ACTIVE' && entity.currentAction === 'PARRY';
  const isCounterFlash = entity.status === 'ACTIVE' && entity.currentAction === 'COUNTER';

  return (
    <motion.div
      variants={variants[entity.id]}
      animate={variantState}
      className="relative w-32 h-44 flex items-end justify-center"
    >
      {/* Body wrapper — mirrored for the AI so every pose faces its opponent */}
      <div
        className="relative w-full h-full"
        style={{ transform: isLeft ? 'none' : 'scaleX(-1)' }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={poseSrc}
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 6 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute inset-0"
            style={{
              WebkitMaskImage: `url(${poseSrc})`,
              maskImage: `url(${poseSrc})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'bottom center',
              maskPosition: 'bottom center',
              backgroundColor: isCounterFlash ? '#00FFAA' : teamColor,
              filter: `drop-shadow(0 0 14px ${isCounterFlash ? '#00FFAA' : teamColor}90)`,
            }}
          />
        </AnimatePresence>
      </div>

      {/* Parry flash ring */}
      {isParryFlash && (
        <motion.div
          initial={{ opacity: 0.6, scale: 0.8 }}
          animate={{ opacity: 0, scale: 1.4 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-full border-4 pointer-events-none"
          style={{ borderColor: teamColor }}
        />
      )}

      {/* Counter flash ring */}
      {isCounterFlash && (
        <motion.div
          initial={{ opacity: 0.8, scale: 0.8 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 rounded-full border-4 pointer-events-none"
          style={{ borderColor: '#00FFAA' }}
        />
      )}

      {/* Riposte window ring — signals "the punish is live, swing now" */}
      {riposteReady && (
        <motion.div
          animate={{ opacity: [0.3, 0.9, 0.3], scale: [1, 1.08, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="absolute inset-0 rounded-full border-4 pointer-events-none"
          style={{ borderColor: '#FFD400', boxShadow: '0 0 18px rgba(255,212,0,0.6)' }}
        />
      )}

      {/* Visual FX based on state */}
      {entity.status === 'STUNNED' && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-6 text-yellow-400 font-bold font-mono text-sm"
        >
          <Zap className="w-6 h-6 fill-yellow-400" />
        </motion.div>
      )}

      {/* Floating damage / heal numbers */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none">
        <AnimatePresence>
          {damageNumbers.map(d => (
            <motion.div
              key={d.id}
              initial={{ opacity: 1, y: 0, scale: d.isCounter ? 1.3 : 1 }}
              animate={{ opacity: 0, y: -56, scale: d.isCounter ? 1.5 : 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
              className={`absolute whitespace-nowrap font-mono font-black tracking-wide ${
                d.isHeal
                  ? 'text-[#3EF08C] text-lg'
                  : d.isRiposte
                  ? 'text-[#FFD400] text-3xl'
                  : d.isCounter
                  ? 'text-[#00FFAA] text-2xl'
                  : 'text-[#FFD400] text-xl'
              }`}
              style={{ left: (Math.random() - 0.5) * 30, textShadow: d.isRiposte ? '0 0 12px rgba(255,212,0,0.8)' : '0 0 8px rgba(0,0,0,0.9)' }}
            >
              {d.isRiposte ? `RIPOSTE! ${d.amount}` : d.isHeal ? `+${d.amount}` : `-${d.amount}`}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

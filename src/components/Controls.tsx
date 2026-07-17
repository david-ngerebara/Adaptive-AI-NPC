import React from 'react';
import { motion } from 'motion/react';
import { ActionType, GameState } from '../engine/types';
import { STAMINA_COSTS, STAMINA_MAX } from '../engine/constants';
import { UNLOCK_COUNTER_STREAK } from '../engine/progression';
import { Shield, Zap, RefreshCw, Heart, Sword, ShieldCheck, Lock, Gauge } from 'lucide-react';

interface ControlsProps {
  state: GameState;
  onAction: (action: ActionType) => void;
  unlockedCounter: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ state, onAction, unlockedCounter }) => {
  const { player } = state;
  const baseDisabled = state.status !== 'PLAYING' || player.status !== 'IDLE';

  const cantAfford = (action: ActionType) => player.stamina < (STAMINA_COSTS[action] ?? 0);
  const onCooldown = (action: ActionType) =>
    (action === 'PARRY' && player.parryCooldown > 0) ||
    (action === 'COUNTER' && player.counterCooldown > 0);
  const cooldownSecs = (action: ActionType) => {
    const ms = action === 'PARRY' ? player.parryCooldown : action === 'COUNTER' ? player.counterCooldown : 0;
    return Math.ceil(ms / 100) / 10;
  };

  const staminaPct = Math.max(0, Math.min(100, (player.stamina / STAMINA_MAX) * 100));
  const lowStamina = staminaPct < 25;
  const riposteReady = player.riposteMs > 0;

  return (
    <div className="bg-[#0D0D0D] border border-[#222] p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2 border-b border-[#222] pb-2">
        <div className="text-xs font-bold text-[#666] uppercase tracking-widest">Subject Controls</div>
        <div className="flex items-center gap-2">
          <Gauge className={`w-4 h-4 ${lowStamina ? 'text-[#FF0055]' : 'text-[#FFD400]'}`} />
          <span className="text-[10px] font-mono tracking-widest text-[#666] uppercase">Stamina</span>
        </div>
      </div>

      {/* Stamina bar */}
      <div className="h-2.5 bg-[#1A1A1A] overflow-hidden border border-[#333] -mt-2 mb-1">
        <motion.div
          className={`h-full ${lowStamina ? 'bg-[#FF0055]' : 'bg-[#FFD400]'}`}
          animate={{ width: `${staminaPct}%` }}
          transition={{ duration: 0.15 }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ActionButton
          icon={<Sword className="w-5 h-5 text-[#3366FF]" />}
          label="Light Attack"
          desc={riposteReady ? 'RIPOSTE READY' : undefined}
          cost={STAMINA_COSTS.LIGHT}
          onClick={() => onAction('LIGHT')}
          disabled={baseDisabled || cantAfford('LIGHT')}
          className={riposteReady ? 'border-[#FFD400] shadow-[0_0_16px_rgba(255,212,0,0.4)] animate-pulse' : ''}
        />
        <ActionButton
          icon={<Zap className="w-5 h-5 text-[#FF0055]" />}
          label="Heavy Attack"
          desc={riposteReady ? 'RIPOSTE READY' : undefined}
          cost={STAMINA_COSTS.HEAVY}
          onClick={() => onAction('HEAVY')}
          disabled={baseDisabled || cantAfford('HEAVY')}
          primary
          className={riposteReady ? 'border-[#FFD400] shadow-[0_0_16px_rgba(255,212,0,0.4)] animate-pulse' : ''}
        />
        <ActionButton
          icon={<RefreshCw className="w-5 h-5 text-[#3366FF]" />}
          label="Dodge"
          cost={STAMINA_COSTS.DODGE}
          onClick={() => onAction('DODGE')}
          disabled={baseDisabled || cantAfford('DODGE')}
        />
        <ActionButton
          icon={<Shield className="w-5 h-5 text-[#3366FF]" />}
          label="Parry"
          cost={STAMINA_COSTS.PARRY}
          cooldownLabel={onCooldown('PARRY') ? `CD ${cooldownSecs('PARRY')}s` : undefined}
          onClick={() => onAction('PARRY')}
          disabled={baseDisabled || cantAfford('PARRY') || onCooldown('PARRY')}
        />

        {unlockedCounter ? (
          <ActionButton
            icon={<ShieldCheck className="w-5 h-5 text-[#00FFAA]" />}
            label="Counter Stance"
            cost={STAMINA_COSTS.COUNTER}
            cooldownLabel={onCooldown('COUNTER') ? `CD ${cooldownSecs('COUNTER')}s` : undefined}
            onClick={() => onAction('COUNTER')}
            disabled={baseDisabled || cantAfford('COUNTER') || onCooldown('COUNTER')}
            className="border-[#00FFAA]/50 col-span-2"
          />
        ) : (
          <ActionButton
            icon={<Lock className="w-5 h-5 text-[#555]" />}
            label="??? Locked"
            desc={`Win ${UNLOCK_COUNTER_STREAK} in a row to unlock`}
            onClick={() => {}}
            disabled
            className="col-span-2 grayscale opacity-40 cursor-not-allowed"
          />
        )}
      </div>
      
      <div className="mt-2">
        <ActionButton
          icon={<Heart className="w-5 h-5 text-black" />}
          label="Heal"
          onClick={() => onAction('HEAL')}
          disabled={baseDisabled}
          className="w-full bg-[#3366FF] text-black hover:bg-[#2850DB] border-none"
        />
      </div>
    </div>
  );
};

const ActionButton = ({ icon, label, desc, cost, cooldownLabel, onClick, disabled, primary, className = '' }: any) => {
  const isBlack = className.includes('text-black');
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-start p-4 border transition-all text-left
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:-translate-y-1 hover:shadow-[4px_4px_0_#3366FF] active:translate-x-1 active:translate-y-1 active:shadow-none'}
        ${primary ? 'bg-[#1A1A1A] border-[#FF0055]/50' : 'bg-[#1A1A1A] border-[#333] hover:border-[#3366FF]'}
        ${className}
      `}
    >
      {typeof cost === 'number' && cost > 0 && (
        <span className={`absolute top-2 right-2 text-[9px] font-mono tracking-widest ${isBlack ? 'text-black/70' : 'text-[#FFD400]'}`}>
          -{cost} STA
        </span>
      )}
      {cooldownLabel && (
        <span className="absolute top-2 right-2 text-[9px] font-mono tracking-widest text-[#FF0055]">
          {cooldownLabel}
        </span>
      )}
      <div className="flex items-center gap-3 mb-1">
        {icon}
        <span className={`font-black tracking-widest uppercase ${isBlack ? 'text-black' : 'text-[#F0F0F0]'}`}>{label}</span>
      </div>
      <span className={`text-xs font-mono tracking-widest uppercase ${isBlack ? 'text-black/70' : 'text-[#888]'}`}>{desc}</span>
    </button>
  );
};

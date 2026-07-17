import React from 'react';
import { GameState } from '../engine/types';
import { tierLabel } from '../engine/progression';
import { motion } from 'motion/react';
import { BrainCircuit, Activity, Eye, ShieldAlert, Crosshair, Target, Heart, RefreshCw, Lock, Flame } from 'lucide-react';

interface AIBrainProps {
  state: GameState;
  streak: number;
  bestStreak: number;
  compact?: boolean;
}

export const AIBrain: React.FC<AIBrainProps> = ({ state, streak, bestStreak, compact = false }) => {
  const { ai, history } = state;
  const stats = ai.stats;

  const getModeDescription = (mode: string) => {
    switch (mode) {
      case 'PATIENT': return 'High evasion detected. Using delayed strikes to catch recovery frames.';
      case 'TRICKY': return 'High parry rate detected. Feinting to bait and punish parries.';
      case 'CAUTIOUS': return 'Heavy attacks detected. Maintaining distance, punishing windups.';
      case 'AGGRESSIVE': return 'Frequent healing detected. Relentless assault to interrupt.';
      default: return 'Analyzing behavioral patterns. Maintaining standard engagement parameters.';
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'PATIENT': return 'text-[#FF0055] border-[#FF0055]';
      case 'TRICKY': return 'text-[#3366FF] border-[#3366FF]';
      case 'CAUTIOUS': return 'text-[#FF5500] border-[#FF5500]';
      case 'AGGRESSIVE': return 'text-[#FFFF00] border-[#FFFF00]';
      default: return 'text-[#F0F0F0] border-[#333]';
    }
  };

  if (compact) {
    return (
      <div className="bg-[#0D0D0D]/95 backdrop-blur-sm border border-[#333] flex flex-col overflow-hidden shadow-2xl">
        <div className="border-b border-[#222] px-3 py-2 flex items-center justify-between bg-[#1A1A1A]">
          <div className="flex items-center gap-2 min-w-0">
            <BrainCircuit className="text-[#3366FF] w-3.5 h-3.5 animate-pulse flex-shrink-0" />
            <h2 className="text-[#F0F0F0] font-black tracking-[0.15em] uppercase text-[10px] truncate">N.T.E.</h2>
          </div>
          <div className="flex items-center gap-1 text-[#FF5500] font-mono text-[10px] tracking-widest flex-shrink-0">
            <Flame className="w-3 h-3" />
            {streak}
          </div>
        </div>

        <div className="p-3 flex flex-col gap-3">
          {/* Threat tier */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-[#1A1A1A] border border-[#333]">
            <span className="text-[9px] font-bold text-[#666] uppercase tracking-widest">Threat</span>
            <span className="text-[10px] font-black tracking-widest text-[#FF5500] uppercase">{tierLabel(ai.difficulty?.tier ?? 0)}</span>
          </div>

          {/* Active Strategy Override */}
          <div className={`px-2 py-1.5 border-l-4 bg-[#1A1A1A] ${getModeColor(ai.mode)}`}>
            <div className="text-xs font-black tracking-widest uppercase">{ai.mode}</div>
          </div>

          {/* Pattern Lock indicator */}
          {ai.lockedAction && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 px-2 py-1.5 bg-[#3366FF]/10 border border-[#3366FF] text-[#3366FF]"
            >
              <Lock className="w-3 h-3 flex-shrink-0" />
              <span className="text-[9px] font-mono tracking-widest uppercase truncate">
                Locked: {ai.lockedAction}
              </span>
            </motion.div>
          )}

          {/* Telemetry Stream */}
          <div className="space-y-2">
            <StatBar compact label="Evasion" value={stats.dodgeRate || 0} color="bg-[#3366FF]" threshold={0.25} />
            <StatBar compact label="Defense" value={stats.parryRate || 0} color="bg-[#FF0055]" threshold={0.25} />
            <StatBar compact label="Reckless" value={stats.heavyRate || 0} color="bg-[#FF5500]" threshold={0.25} />
            <StatBar compact label="Healing" value={stats.healRate || 0} color="bg-[#FFFF00]" threshold={0.15} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D0D0D] border border-[#222] flex flex-col overflow-hidden h-full">
      <div className="border-b border-[#222] p-4 flex items-center justify-between bg-[#1A1A1A]">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-[#3366FF] w-6 h-6 animate-pulse" />
          <h2 className="text-[#F0F0F0] font-black tracking-[0.2em] uppercase text-sm">NEURAL TACTICAL ENGINE</h2>
        </div>
        <div className="flex items-center gap-1 text-[#FF5500] font-mono text-xs tracking-widest">
          <Flame className="w-4 h-4" />
          {streak}
          <span className="text-[#555] ml-1">/ BEST {bestStreak}</span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto">

        {/* Threat tier */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1A1A1A] border border-[#333]">
          <span className="text-xs font-bold text-[#666] uppercase tracking-widest">Opponent Threat Tier</span>
          <span className="text-sm font-black tracking-widest text-[#FF5500] uppercase">{tierLabel(ai.difficulty?.tier ?? 0)}</span>
        </div>
        
        {/* Active Strategy Override */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-[#666] uppercase tracking-widest flex items-center gap-2 border-b border-[#222] pb-2">
            <Activity className="w-4 h-4" /> Current Override Paradigm
          </div>
          <div className={`p-4 border-l-4 bg-[#1A1A1A] ${getModeColor(ai.mode)}`}>
            <div className="text-xl font-black tracking-widest mb-2 uppercase">{ai.mode}</div>
            <div className="text-sm opacity-80 font-mono leading-relaxed">
              {getModeDescription(ai.mode)}
            </div>
          </div>

          {/* Pattern Lock indicator */}
          {ai.lockedAction && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-3 bg-[#3366FF]/10 border border-[#3366FF] text-[#3366FF]"
            >
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-mono tracking-widest uppercase">
                Pattern Locked — Countering {ai.lockedAction}
              </span>
            </motion.div>
          )}
        </div>

        {/* Telemetry Stream */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-[#666] uppercase tracking-widest flex items-center gap-2 border-b border-[#222] pb-2">
            <Target className="w-4 h-4" /> Live Subject Telemetry (Last 20)
          </div>
          
          <div className="space-y-4">
            <StatBar label="Evasiveness" value={stats.dodgeRate || 0} icon={<RefreshCw className="w-3 h-3"/>} color="bg-[#3366FF]" threshold={0.25} />
            <StatBar label="Defensiveness" value={stats.parryRate || 0} icon={<ShieldAlert className="w-3 h-3"/>} color="bg-[#FF0055]" threshold={0.25} />
            <StatBar label="Recklessness" value={stats.heavyRate || 0} icon={<Crosshair className="w-3 h-3"/>} color="bg-[#FF5500]" threshold={0.25} />
            <StatBar label="Self-Preservation" value={stats.healRate || 0} icon={<Heart className="w-3 h-3"/>} color="bg-[#FFFF00]" threshold={0.15} />
          </div>
        </div>

        {/* Action History Log */}
        <div className="space-y-3 mt-auto">
          <div className="text-xs font-bold text-[#666] uppercase tracking-widest flex items-center gap-2 border-b border-[#222] pb-2">
            <Eye className="w-4 h-4" /> Action Stream
          </div>
          <div className="flex flex-wrap gap-1">
            {history.length === 0 && <span className="text-[#666] font-mono text-xs uppercase tracking-widest">Awaiting data...</span>}
            {history.map((action, i) => (
              <span
                key={i}
                className={`px-2 py-1 border text-[10px] font-mono tracking-widest uppercase ${
                  ai.lockedAction === action && i >= history.length - 2
                    ? 'bg-[#3366FF]/20 border-[#3366FF] text-[#3366FF]'
                    : 'bg-[#1A1A1A] border-[#333] text-[#F0F0F0]'
                }`}
              >
                {action}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

const StatBar = ({ label, value, color, threshold, icon, compact }: any) => {
  const pct = Math.round(value * 100);
  const isTriggered = value >= threshold;

  if (compact) {
    return (
      <div>
        <div className="flex justify-between text-[9px] mb-1 font-mono tracking-widest uppercase">
          <span className={isTriggered ? 'text-[#F0F0F0] font-black' : 'text-[#888]'}>{label}</span>
          <span className={isTriggered ? 'text-[#FF0055] font-black' : 'text-[#666]'}>{pct}%</span>
        </div>
        <div className="h-1.5 bg-[#1A1A1A] overflow-hidden relative border border-[#333]">
          <div className="absolute top-0 bottom-0 w-px bg-[#FF0055] z-10" style={{ left: `${threshold * 100}%` }} />
          <motion.div
            className={`h-full ${isTriggered ? 'bg-[#FF0055]' : color}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between text-xs mb-2 font-mono tracking-widest uppercase">
        <span className={`flex items-center gap-1 ${isTriggered ? 'text-[#F0F0F0] font-black' : 'text-[#888]'}`}>
          {label}
        </span>
        <span className={isTriggered ? 'text-[#FF0055] font-black' : 'text-[#666]'}>{pct}%</span>
      </div>
      <div className="h-3 bg-[#1A1A1A] overflow-hidden relative border border-[#333]">
        {/* Threshold marker */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-[#FF0055] z-10" style={{ left: `${threshold * 100}%` }} />
        
        <motion.div
          className={`h-full ${isTriggered ? 'bg-[#FF0055]' : color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

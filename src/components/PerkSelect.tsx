import React from 'react';
import { motion } from 'motion/react';
import { PerkDef, PerkId } from '../engine/types';
import { Zap, Shield, RefreshCw, Droplet, Gauge, ShieldCheck, Clock } from 'lucide-react';

interface PerkSelectProps {
  choices: PerkDef[];
  onChoose: (id: PerkId) => void;
}

// Each perk gets its own icon/accent so the cards read at a glance rather
// than as interchangeable text blocks.
const PERK_VISUALS: Record<PerkId, { icon: React.ReactNode; color: string }> = {
  WIDE_PARRY: { icon: <Shield className="w-6 h-6" />, color: '#3366FF' },
  FAST_HEAL: { icon: <Zap className="w-6 h-6" />, color: '#FFFF00' },
  MOMENTUM: { icon: <RefreshCw className="w-6 h-6" />, color: '#3366FF' },
  VAMPIRIC: { icon: <Droplet className="w-6 h-6" />, color: '#FF0055' },
  ADRENALINE: { icon: <Gauge className="w-6 h-6" />, color: '#FFD400' },
  IRON_SKIN: { icon: <ShieldCheck className="w-6 h-6" />, color: '#00FFAA' },
  QUICK_HANDS: { icon: <Clock className="w-6 h-6" />, color: '#FF5500' },
};

export const PerkSelect: React.FC<PerkSelectProps> = ({ choices, onChoose }) => {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
      <div className="text-center">
        <div className="text-xs font-mono tracking-[0.3em] uppercase text-[#3366FF] mb-1">
          // Run Upgrade //
        </div>
        <h3 className="text-2xl md:text-3xl font-black tracking-widest text-[#F0F0F0] uppercase">
          Choose a Perk
        </h3>
        <p className="text-[#666] font-mono text-xs uppercase tracking-widest mt-1">
          Active for this run only — lost on defeat
        </p>
      </div>

      <div className={`grid gap-4 w-full ${choices.length === 3 ? 'grid-cols-1 md:grid-cols-3' : choices.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {choices.map((perk, i) => {
          const visual = PERK_VISUALS[perk.id];
          return (
            <motion.button
              key={perk.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onChoose(perk.id)}
              className="flex flex-col items-start text-left gap-3 p-5 bg-[#1A1A1A] border border-[#333] hover:-translate-y-1 hover:shadow-[4px_4px_0_var(--perk-color)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              style={{ ['--perk-color' as any]: visual.color, borderColor: undefined }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = visual.color)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#333')}
            >
              <div className="flex items-center gap-3">
                <div style={{ color: visual.color }}>{visual.icon}</div>
                <span className="font-black tracking-widest uppercase text-[#F0F0F0] text-sm">{perk.name}</span>
              </div>
              <span className="text-xs font-mono tracking-wide text-[#888] leading-relaxed">
                {perk.description}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

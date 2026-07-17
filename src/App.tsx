import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useGameEngine } from './hooks/useGameEngine';
import { Arena } from './components/Arena';
import { Controls } from './components/Controls';
import { AIBrain } from './components/AIBrain';
import { PerkSelect } from './components/PerkSelect';
import { UNLOCK_COUNTER_STREAK } from './engine/progression';
import { PerkId } from './engine/types';
import { getPerkDef } from './engine/perks';
import { PlayCircle, Pause, ArrowLeft, Flame, ShieldCheck, Sparkles } from 'lucide-react';

type Screen = 'TITLE' | 'INTRO' | 'CONTROLS' | 'BRAIN_INFO' | 'GAME';

export default function App() {
  const {
    state,
    dispatchPlayerAction,
    startGame,
    pauseGame,
    resumeGame,
    resetToMenu,
    streak,
    bestStreak,
    unlockedCounter,
    justUnlockedCounter,
    perkChoices,
    choosePerk,
  } = useGameEngine();
  const [screen, setScreen] = useState<Screen>('TITLE');
  // True while the win screen is showing perk cards instead of the normal
  // Continue/Reset buttons — a lightweight sub-step, not a full Screen.
  const [showPerkSelect, setShowPerkSelect] = useState(false);

  const handleBeginSimulation = () => {
    startGame(false);
    setScreen('GAME');
  };

  const handleOfferPerkChoice = () => {
    // Once every perk has been taken this run there's nothing left to
    // offer — skip straight to the next fight instead of showing an empty screen.
    if (perkChoices.length === 0) {
      startGame(true);
      return;
    }
    setShowPerkSelect(true);
  };

  const handleChoosePerk = (id: PerkId) => {
    setShowPerkSelect(false);
    choosePerk(id);
  };

  const handleNewRun = () => {
    setShowPerkSelect(false);
    startGame(false);
  };

  const handleGoBack = () => {
    setShowPerkSelect(false);
    resetToMenu();
    setScreen('TITLE');
  };

  // --- Screen 1: Title (decorated) ---
  if (screen === 'TITLE') {
    return (
      <div className="relative min-h-screen bg-[#0A0A0A] text-[#F0F0F0] font-sans flex flex-col items-center justify-center gap-10 p-8 border-8 border-[#1A1A1A] overflow-hidden">

        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none" />

        {/* Radial glow behind title */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(51,102,255,0.18),transparent_60%)] pointer-events-none" />

        {/* Scanline sweep */}
        <motion.div
          className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-[#3366FF]/10 to-transparent pointer-events-none"
          initial={{ top: '-10%' }}
          animate={{ top: '110%' }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        />

        {/* Corner brackets */}
        <div className="absolute top-6 left-6 w-14 h-14 border-t-2 border-l-2 border-[#3366FF]/70" />
        <div className="absolute top-6 right-6 w-14 h-14 border-t-2 border-r-2 border-[#3366FF]/70" />
        <div className="absolute bottom-6 left-6 w-14 h-14 border-b-2 border-l-2 border-[#3366FF]/70" />
        <div className="absolute bottom-6 right-6 w-14 h-14 border-b-2 border-r-2 border-[#3366FF]/70" />

        {/* Status line */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute top-10 flex items-center gap-2 font-mono text-[11px] tracking-[0.35em] uppercase text-[#3366FF] z-10"
        >
          <motion.span
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-[#3366FF] shadow-[0_0_10px_#3366FF]"
          />
          System Online
        </motion.div>

        {/* Title block */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 text-center"
        >
          <div className="font-mono text-xs tracking-[0.4em] uppercase text-[#3366FF] mb-4">
            // Tactical Combat Simulation //
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(51,102,255,0.55)]">
            ADAPTIVE<br />
            <span className="text-[#3366FF]">AI NPC</span>
          </h1>
        </motion.div>

        {/* Best streak readout */}
        {bestStreak > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative z-10 flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-[#FF5500]"
          >
            <Flame className="w-4 h-4" />
            Best Streak: {bestStreak}
            {unlockedCounter && (
              <span className="flex items-center gap-1 text-[#00FFAA] ml-3">
                <ShieldCheck className="w-4 h-4" /> Counter Stance Unlocked
              </span>
            )}
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="relative z-10"
        >
          <PrimaryButton onClick={() => setScreen('INTRO')}>
            <PlayCircle className="w-5 h-5" />
            CONTINUE
          </PrimaryButton>
        </motion.div>

        <div className="absolute bottom-6 font-mono text-[10px] tracking-widest text-[#444] uppercase z-10">
          v1.0.0 // Neural Combat Sim
        </div>
      </div>
    );
  }

  // --- Screen 2: Intro ---
  if (screen === 'INTRO') {
    return (
      <InfoShell>
        <p className="max-w-xl text-center text-lg md:text-xl font-mono leading-relaxed text-[#CCC]">
          A combat AI that reads your patterns and counters them in real time.
          <br /><br />
          <span className="text-[#3366FF] font-bold tracking-widest uppercase">Made by IceColdPlayz</span>
        </p>
        <PrimaryButton onClick={() => setScreen('CONTROLS')}>
          LEARN CONTROLS
        </PrimaryButton>
      </InfoShell>
    );
  }

  // --- Screen 3: Controls ---
  if (screen === 'CONTROLS') {
    return (
      <InfoShell>
        <div className="text-xs font-bold text-[#666] uppercase tracking-widest mb-2">Subject Controls</div>
        <div className="max-w-2xl space-y-4 text-left font-mono text-sm md:text-base leading-relaxed text-[#CCC] border-t border-[#222] pt-6">
          <p>The <span className="text-[#3366FF] font-bold">Light Attack</span> button makes the player do fast, low damage.</p>
          <p>The <span className="text-[#FF0055] font-bold">Heavy Attack</span> button makes the player do slow, high damage.</p>
          <p>The <span className="text-[#3366FF] font-bold">Dodge</span> button makes you evade attacks.</p>
          <p>The <span className="text-[#3366FF] font-bold">Parry / Block</span> button makes you block an opponent's attack, stunning them in the process for a short time.</p>
          <p>There is also a <span className="text-[#FFFF00] font-bold">Heal</span> button that makes the player heal 30 HP, but there's a windup.</p>
          <p>Win <span className="text-[#00FFAA] font-bold">{UNLOCK_COUNTER_STREAK} fights in a row</span> to permanently unlock <span className="text-[#00FFAA] font-bold">Counter Stance</span> — it reflects damage and stuns the attacker, but whiffing it leaves you exposed for a long time.</p>
        </div>
        <PrimaryButton onClick={() => setScreen('BRAIN_INFO')}>
          CONTINUE
        </PrimaryButton>
      </InfoShell>
    );
  }

  // --- Screen 4: Brain Info ---
  if (screen === 'BRAIN_INFO') {
    return (
      <InfoShell>
        <p className="max-w-xl text-center text-lg md:text-xl font-mono leading-relaxed text-[#CCC]">
          While the simulation is in progress, there is a <span className="text-[#3366FF] font-bold">Neural Tactical Engine</span> that serves as the brain of the AI.
          <br /><br />
          It shows what it is thinking and detects the stats of the player so it can counter-attack. Winning consecutive fights raises the AI's <span className="text-[#FF5500] font-bold">Threat Tier</span> — it reacts faster and hits harder the longer your streak runs.
          <br /><br />
          There is also an <span className="text-[#3366FF] font-bold">Action Stream</span> that shows the attacks in sequence that the player does.
        </p>
        <PrimaryButton onClick={handleBeginSimulation}>
          <PlayCircle className="w-5 h-5" />
          BEGIN SIMULATION
        </PrimaryButton>
      </InfoShell>
    );
  }

  // --- Screen 5: Game ---
  // The logo is intentionally gone here — the simulation itself owns the whole
  // screen while it's running, so nothing but a slim status bar sits above it.
  return (
    <div className="h-screen w-screen bg-[#0A0A0A] text-[#F0F0F0] font-sans flex flex-col overflow-hidden">

      {/* Slim status bar (no logo) */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-[#222] bg-[#0A0A0A] z-30">
        <div className="flex items-center gap-2 font-mono text-[10px] md:text-xs tracking-[0.3em] uppercase text-[#3366FF]">
          <motion.span
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-[#3366FF] shadow-[0_0_8px_#3366FF]"
          />
          Live Simulation
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#333] px-3 py-2 font-mono text-xs tracking-widest">
            <Flame className="w-4 h-4 text-[#FF5500]" />
            <span className="text-[#F0F0F0] font-black">{streak}</span>
            <span className="text-[#666] hidden sm:inline">STREAK</span>
          </div>

          {state.perks.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 bg-[#1A1A1A] border border-[#333] px-3 py-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FFD400] flex-shrink-0" />
              {state.perks.map(id => (
                <span
                  key={id}
                  title={getPerkDef(id).description}
                  className="text-[9px] font-mono tracking-widest uppercase text-[#F0F0F0] bg-[#0A0A0A] border border-[#333] px-1.5 py-0.5 cursor-help"
                >
                  {getPerkDef(id).name}
                </span>
              ))}
            </div>
          )}

          {state.status === 'PLAYING' && (
            <button
              onClick={pauseGame}
              className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#222] text-[#F0F0F0] px-4 py-2 font-black tracking-widest uppercase transition-all border border-[#333] text-xs"
            >
              <Pause className="w-4 h-4" />
              <span className="hidden sm:inline">PAUSE</span>
            </button>
          )}

          {state.status === 'GAME_OVER_LOSE' && (
            <button
              onClick={handleNewRun}
              className="flex items-center gap-2 bg-[#3366FF] hover:bg-[#2850DB] text-black px-4 py-2 font-black tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(51,102,255,0.3)] border border-[#3366FF] text-xs"
            >
              <PlayCircle className="w-4 h-4" />
              RESTART
            </button>
          )}
        </div>
      </header>

      {/* Fullscreen combat stage */}
      <div className="relative flex-1 min-h-0">
        <Arena state={state} />

        {/* Pause Overlay */}
        {state.status === 'PAUSED' && (
          <div className="absolute inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">
            <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-8 max-w-4xl w-full">

              {/* Neural Tactical Engine lives here while paused, out of the way of the arena */}
              <div className="w-full lg:w-80 h-[420px] flex-shrink-0">
                <AIBrain state={state} streak={streak} bestStreak={bestStreak} />
              </div>

              <div className="text-center flex flex-col items-center justify-center gap-4 flex-1">
                <h2 className="text-4xl font-black tracking-widest text-[#F0F0F0] mb-2">SIMULATION PAUSED</h2>
                <button
                  onClick={resumeGame}
                  className="flex items-center gap-2 bg-[#3366FF] text-black px-8 py-3 font-black tracking-widest uppercase hover:bg-[#2850DB] transition-colors w-56 justify-center"
                >
                  <PlayCircle className="w-5 h-5" />
                  RESUME
                </button>
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-2 bg-[#1A1A1A] border border-[#333] text-[#F0F0F0] px-8 py-3 font-black tracking-widest uppercase hover:bg-[#222] transition-colors w-56 justify-center"
                >
                  <ArrowLeft className="w-5 h-5" />
                  GO BACK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over: Win Overlay — offers continuing the streak (harder AI) or ending the run */}
        {state.status === 'GAME_OVER_WIN' && (
          <div className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">
            {showPerkSelect ? (
              <PerkSelect choices={perkChoices} onChoose={handleChoosePerk} />
            ) : (
              <div className="text-center flex flex-col items-center gap-4">
                <h2 className="text-5xl font-black mb-1 text-[#3366FF]">SUBJECT VICTORIOUS</h2>
                <div className="flex items-center gap-2 font-mono text-sm tracking-widest uppercase text-[#FF5500]">
                  <Flame className="w-4 h-4" /> Streak: {streak} {streak === bestStreak && streak > 0 ? '(New Best!)' : ''}
                </div>

                {justUnlockedCounter && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#00FFAA]/10 border border-[#00FFAA] text-[#00FFAA] font-mono text-xs tracking-widest uppercase"
                  >
                    <ShieldCheck className="w-4 h-4" /> Counter Stance Unlocked!
                  </motion.div>
                )}

                <p className="text-[#888] font-mono uppercase tracking-widest text-xs mt-2">
                  Continuing raises the AI's Threat Tier — and lets you pick a run perk.
                </p>

                <div className="flex flex-col gap-3 mt-2 w-64">
                  <button
                    onClick={handleOfferPerkChoice}
                    className="flex items-center gap-2 justify-center bg-[#3366FF] text-black px-8 py-3 font-black tracking-widest uppercase hover:bg-[#2850DB] transition-colors"
                  >
                    <PlayCircle className="w-5 h-5" />
                    CONTINUE STREAK
                  </button>
                  <button
                    onClick={handleNewRun}
                    className="flex items-center gap-2 justify-center bg-[#1A1A1A] border border-[#333] text-[#F0F0F0] px-8 py-3 font-black tracking-widest uppercase hover:bg-[#222] transition-colors"
                  >
                    END RUN &amp; RESET
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Game Over: Lose Overlay */}
        {state.status === 'GAME_OVER_LOSE' && (
          <div className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <h2 className="text-5xl font-black mb-2 text-[#FF0055]">SUBJECT TERMINATED</h2>
              <p className="text-[#888] font-mono mb-2 uppercase tracking-widest">Simulation concluded. Streak reset to 0.</p>
              {bestStreak > 0 && (
                <p className="text-[#FF5500] font-mono mb-6 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  <Flame className="w-4 h-4" /> Best Streak: {bestStreak}
                </p>
              )}
              <button
                onClick={handleNewRun}
                className="bg-[#3366FF] text-black px-8 py-3 font-black tracking-widest uppercase hover:bg-[#2850DB] transition-colors"
              >
                RUN AGAIN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls pinned to the bottom of the screen */}
      <div className="flex-shrink-0 border-t border-[#222] z-30">
        <Controls state={state} onAction={dispatchPlayerAction} unlockedCounter={unlockedCounter} />
      </div>

    </div>
  );
}

function InfoShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F0F0F0] font-sans flex flex-col items-center justify-center gap-10 p-8 border-8 border-[#1A1A1A]">
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-[#3366FF] hover:bg-[#2850DB] text-black px-8 py-4 font-black tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(51,102,255,0.3)] border border-[#3366FF]"
    >
      {children}
    </button>
  );
}

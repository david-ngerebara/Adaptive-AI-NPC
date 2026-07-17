## Inspiration

AI is incredibly powerful, but intelligence isn't the same as mastery. Even the smartest AI follows rules, and rules can be learned, predicted, and outplayed. I wanted to build a game where players experience that idea firsthand: an AI that genuinely adapts to you, yet can always be beaten by a more skilled human.

## What it does

**Adaptive AI NPC** is a browser-based 1v1 fighting game where the opponent studies your playstyle in real time.

- **Behavior profiling** — Every second, the AI analyzes your last 20 actions and classifies your playstyle as **Aggressive**, **Patient**, **Tricky**, **Cautious**, or **Balanced**.
- **Pattern recognition** — Repeating the same move triggers immediate counters, discouraging predictable strategies.
- **Skill-based combat** — Stamina management, precise parries, ripostes, and dodges reward timing instead of button mashing.
- **Progression** — Win streaks increase AI difficulty while unlocking permanent abilities and run-specific perks.
- **Live AI telemetry** — A "Neural Tactical Engine" panel shows exactly how the AI is interpreting your behavior.

## How we built it

Built with:

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Motion

The combat engine is completely independent of React. The entire game simulation is driven by a pure update function, allowing the simulation to run every animation frame while React simply renders the latest state.

The AI is entirely rule-based. Every second it analyzes the player's recent actions and chooses the strategy that best counters the observed behavior. Difficulty scales with the player's win streak, which adjusts AI reaction speed, damage, and health while remaining fair.

## Challenges we ran into

Balancing the **Parry** mechanic was our biggest challenge. Early versions encouraged players to spam it, making combat too easy.

We redesigned it so a parry is only *perfect* if the attack lands within a short timing window, while mistimed parries become weaker blocks instead of full counters. Adding stamina costs, cooldowns, and high-damage ripostes transformed parry into a high-risk, high-reward mechanic. We also had to synchronize hit-stop and slow-motion effects without desynchronizing the game simulation.

## Accomplishments that we are proud of

- Built an AI that convincingly adapts using simple, explainable rules.
- Created combat that rewards timing, strategy, and resource management.
- Designed a modular architecture that cleanly separates simulation from rendering.
- Built transparent AI telemetry so players can understand and outsmart the AI.

## What we learned

- Constraints create more engaging gameplay than unrestricted mechanics.
- Simple rule-based systems can feel surprisingly intelligent.
- Separating simulation from rendering makes balancing and iteration dramatically easier.
- Rewarding skilled play is more satisfying than simply nerfing powerful mechanics.

## What's next for Adaptive AI NPC

- Global leaderboards and player statistics.
- More AI strategies and adaptive counter-patterns.
- Additional perks and roguelike synergies.
- Richer AI telemetry explaining **why** the AI makes each decision.
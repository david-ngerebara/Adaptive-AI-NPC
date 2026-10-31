# Adaptive AI NPC
### An opponent that learns your habits. Can you outsmart it?

AI is incredibly powerful, but intelligence isn't the same as mastery. Even the smartest AI follows rules, and those rules can be learned, predicted, and outplayed.

I wanted to build a game where players could experience that idea firsthand: an opponent that studies how you play and changes its strategy, but can still be beaten by someone who learns to outsmart it.

**Play it:** [Adaptive AI NPC](https://adaptive-ai-npc.vercel.app/)

## What it does

Adaptive AI NPC is a browser-based 1v1 fighting game where the opponent analyzes your behavior and adapts to your playstyle.

- **Behavior profiling:** The AI analyzes the player's last 20 actions every second and classifies their playstyle as Aggressive, Patient, Tricky, Cautious, or Balanced.
- **Pattern recognition:** Repeating the same moves makes the opponent recognize your habits and choose counters.
- **Skill-based combat:** Stamina management, parries, ripostes, and dodges reward timing and strategy instead of simply pressing buttons repeatedly.
- **Difficulty progression:** Winning streaks increase the opponent's difficulty by adjusting its reaction speed, damage, and health.
- **Unlockable progression:** Win streaks also connect to permanent abilities and run-specific perks.
- **Live AI telemetry:** A Neural Tactical Engine panel shows how the opponent is interpreting your behavior.

For example, if you keep using light attacks, the opponent can recognize the pattern and respond with a counter or parry. You'll have to change your strategy if you want to keep winning.

## How I built it

I built the game using:

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Motion

One architectural decision I'm particularly proud of is keeping the combat simulation separate from React. The game simulation runs through its own update function, while React is responsible for displaying the latest state.

The AI itself is **rule-based**, not a traditionally trained machine-learning model. It analyzes recent player actions, identifies patterns, and chooses strategies based on predefined rules.

I wanted the AI to be understandable, not just unpredictable. That's also why I added the live telemetry panel: players can see how the opponent interprets their behavior.

## Challenges I ran into

One of the hardest mechanics to balance was parrying.

In early versions, players could spam parry and make combat too easy. I wanted parrying to reward good timing instead of becoming a guaranteed defense.

I changed the mechanic so a parry only counts as perfect when it happens within a short timing window. If the timing is wrong, it becomes a weaker block instead. I also added stamina costs, cooldowns, and high-damage ripostes to make successful parries more rewarding.

Another challenge was synchronizing hit-stop and slow-motion effects without disrupting the actual game simulation.

I also spent time balancing the adaptive opponent. I wanted it to punish predictable behavior without making the game feel unfair or impossible to win.

## What I'm proud of

I'm especially proud that I was able to make a relatively simple rule-based system feel responsive and intelligent.

I didn't need to train a massive model to create an opponent that could recognize patterns and change its behavior. Instead, I focused on designing rules that make the player think differently about how they approach combat.

I'm also proud of separating the game simulation from the interface and building a telemetry panel that makes the AI's decisions easier to understand.

## What I learned

This project taught me that simple systems can produce surprisingly interesting behavior when their rules are designed carefully.

I also learned more about game architecture, state updates, timing, and balancing mechanics. Most importantly, I realized that an AI opponent doesn't have to be unbeatable to feel intelligent. Sometimes the most interesting opponent is one that adapts to you but still gives you a chance to outsmart it.

## What's next?

I'd like to keep expanding the game with:

- Global leaderboards and player statistics.
- More opponent strategies and counter-patterns.
- Additional abilities, perks, and roguelike combinations.
- More detailed telemetry explaining why the AI makes certain decisions.

## Development tools

I designed and developed Adaptive AI NPC myself, using Claude and GitHub Copilot as coding assistants. They helped me generate portions of code and work through debugging challenges while I directed the design and development of the game.

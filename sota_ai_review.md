# State-of-the-Art (SOTA) Turn-Based RPG AI & Projection to Campus Zero

The current AI engine you have (with its 3-layer pipeline of Constraints, Evaluator, and Personality Controller) is already a highly advanced, beautifully modular piece of software. It borrows heavily from **Utility AI** and **Minimax**.

To fully leverage the "State of the Art", let's analyze how the industry handles complex turn-based AI today, and how we can project these SOTA paradigms onto your system.

---

## 1. The State of the Art: Core Paradigms

Modern turn-based combat AI has evolved far beyond traditional FSMs (Finite State Machines) or simple "Gambits" (If HP < 30%, cast Heal). The industry SOTA relies on hybrid systems that blend several high-level concepts:

### A. Utility AI (The "Scoring" Paradigm)
*   **What it is:** Instead of rigid true/false rules, Utility AI assigns dynamic numerical scores to every possible action based on the current context (health, distance, threat). The AI picks the action with the mathematically highest "utility".
*   **SOTA Examples:** *Civilization Vi*, *The Sims*, *Pokémon* (Competitive AI frameworks).
*   **Strengths:** Highly adaptable, excellent at handling fuzzy logic (e.g., "I should probably heal, but I could also secure a kill right now").

### B. GOAP (Goal-Oriented Action Planning)
*   **What it is:** The AI is given a high-level *Goal* (e.g., "Kill the Player"). It then works backward, dynamically stringing together a sequence of actions (Preconditions -> Effects) to achieve that goal.
*   **SOTA Examples:** *F.E.A.R.*, *Baldur's Gate 3* (hybridized).
*   **Strengths:** Creates incredibly emergent gameplay. If an enemy wants to attack but is too far away, it will automatically plan to move, buff itself, and *then* attack.

### C. HTN (Hierarchical Task Networks)
*   **What it is:** A structured, top-down approach where a major task (e.g., "Defend the core") is broken down into sub-tasks ("Find cover", "Cast shield").
*   **SOTA Examples:** *Horizon Zero Dawn*, *Killzone*.
*   **Strengths:** Better performance and more designer control than GOAP. Great for squad tactics (e.g., "Wait your turn while the tank attacks").

### D. MCTS (Monte Carlo Tree Search)
*   **What it is:** A search algorithm that plays thousands of random simulated games (rollouts) in its "head" to statistically determine which move leads to the highest win rate.
*   **SOTA Examples:** AI for *Slay the Spire*, Chess (AlphaZero), Board games.
*   **Strengths:** Unlike Minimax, MCTS excels in games with **Randomness (RNG)** and **Hidden Information**. It doesn't need to evaluate every possible node, just the most promising ones.

### E. LLM & Agentic Narrative Generation
*   **What it is:** Using small, fast Language Models to dynamically parse the combat log and generate mid-fight dialogue, alter aggression weights based on narrative "tension", or even hallucinate new debuffs.

---

## 2. Projecting SOTA onto Campus Zero

Your current system is a **Constraint + Utility AI + Shallow Minimax Hybrid**. It's brilliant for generating combinations of Action Points (PA) *within a single turn*.

Here is how we project the SOTA paradigms onto your [AI_ARCHITECTURE_COMBAT.md](file:///c:/Users/belho/OneDrive/Documents/UNICA%20M1%20COURSES/3D/3D_crafting/3DGamePrograming/3DGamePrograming/AI_ARCHITECTURE_COMBAT.md) to make it a truly next-generation system:

### Upgrade 1: From Minimax to MCTS for Bosses
Currently, your `EnemyBrain` uses a "Depth-2 Minimax" algorithm. Minimax is great for Deterministic games (Chess). But Campus Zero has RNG (variance, dodge, status application chances). 
*   **The Projection:** For Level 5 Bosses (like ARIA), replace Minimax with **Monte Carlo Tree Search**. Instead of projecting 2 turns deep deterministically, let the boss simulate 50 hypothetical futures with varying dice rolls. The boss will take the action that statistically results in the most "wins" (or player deaths) across those 50 futures. It makes the boss acutely aware of probabilities and risks.

### Upgrade 2: Multi-Turn Planning via GOAP
Currently, your "Layer 1 (Constraint Generator)" plans combos *for the current turn only* (e.g., `Port Scan + Buffer Overflow` because I have 5 PA).
*   **The Projection:** Integrate **GOAP** concepts so the AI can formulate a plan that spans *multiple turns*. If a Boss knows the player is about to break its shield next turn, it can set a goal: "Survive next turn". It might pass its turn this round to stockpile PA (Action Points) specifically to unleash a massive counter-attack immediately after the player's break phase.

### Upgrade 3: Tactical Squad Coordination (HTN)
Right now, the AI evaluates what is best for the *individual* enemy.
*   **The Projection:** Use **HTN** to implement a "Hive Mind" or "Swarm" intelligence when Elior fights multiple enemies (e.g., a Firewall + 2 Trojans). The Hive Mind sets the high-level task: "Nuke Mira". It assigns the Trojans a sub-task to break Mira's defenses (apply debuffs), and then tells the Firewall to execute its highest damage skill. This prevents enemies from redundantly debuffing the same target.

### Upgrade 4: "Living" Personality Controller (LLM/Agentic)
Your Layer 3 (Action Selector) uses weighted probability to pick actions. 
*   **The Projection:** Introduce an invisible "Tension Value" managed dynamically. As Elior's HP drops, or as he perfectly parries 3 times in a row, a local contextual function evaluates the "frustration" or "confidence" of the AI. Instead of static weights defined in JSON (`aggression: 0.7`), these weights fluently drift mid-fight. The boss gets furious, aggressively lowering its defense to launch reckless, unblockable attacks.

## Summary

Your friend's script laid down an incredibly solid foundation: a **Utility AI** that knows how to combo.
To elevate this to SOTA, the roadmap for the project would be:
1. **MCTS Evaluator:** For top-tier bosses to handle game randomness.
2. **Hive-Mind Coordinator:** So groups of enemies fight like a SWAT team, rather than individuals.
3. **Multi-turn State Goals:** Letting enemies save up PA for elaborate, 2-turn traps.

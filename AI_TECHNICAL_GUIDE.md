# 🤖 Système d'IA - Guide Technique Complet

## Vue d'Ensemble

Le système d'IA de Campus Zero utilise un **système de scoring multi-factoriel** pour calculer la meilleure action pour chaque ennemi. C'est plus intelligent qu'un simple random ou "attaquer le joueur à chaque fois".

---

## Architecture Générale

```
┌──────────────────────────────────────┐
│      calculateBestMove(enemy)         │
└────────────┬─────────────────────────┘
             │
             ├─ generatePossibleActions()
             │  ├─ ATTACK (sur chaque cible)
             │  ├─ SKILL (Power Slash, Neural Burst, Drain)
             │  ├─ DEFEND
             │  └─ HACK_PLAYER (30% chance)
             │
             ├─ scoreActions(actions)
             │  ├─ damageScore (30% weight)
             │  ├─ healthFactorScore
             │  ├─ oneShotBonus (+100 if kill)
             │  ├─ varianceBonus (+0-10 random)
             │  ├─ defensiveBonus (if low HP)
             │  ├─ patternPenalty (-20% if repeated)
             │  └─ bossVariant (special boss logic)
             │
             └─ selectBestAction()
                └─ return Action with highest score
```

---

## Phase 1: Génération des Actions (Exploration)

### Actions Simples
```javascript
// ATTACK
Pour chaque cible possible:
  - Estime les dégâts (ATK + variance - DEF)
  - Ajoute à la liste des actions possibles

// DEFEND
Toujours disponible:
  - Coûte 0 ressources
  - Ajoute à la liste
```

### Actions Compétences (Skills)
```javascript
Chaque ennemi peut avoir:
  - POWER_SLASH     → 1.3x ATK, dégâts + variance
  - NEURAL_BURST    → 1.4x ATK, thématique IA
  - DRAIN           → 0.8x ATK + heal 50% des dégâts
  - LAYER_ATTACK    → Spécial boss (multi-phase)
  - RECURSIVE_LOOP  → Spécial ARIA (boucle infinie possible)

Chaque skill est évalué:
  - Sur chaque cible possible
  - Dégâts estimés
  - Coût en ressources (si applicable)
```

### Hack
```javascript
// 30% de chance d'apparaître dans les actions
if (Math.random() > 0.7) {
  actions.push({
    type: 'HACK_PLAYER',
    successRate: 0.6
  });
}
```

---

## Phase 2: Scoring (Évaluation Complète)

Chaque action reçoit un **score composite**:

### Formula Générale
```javascript
Score = 
  damageScore +
  healthFactor +
  oneShotBonus +
  varianceBonus +
  defensiveBonus +
  patternPenalty +
  bossVariant
```

### Détail de Chaque Facteur

#### **1. Damage Score (30% du poids)**
```javascript
damageScore = estimatedDamage * 0.3

// Example:
// Si action fait 30 dégâts: score += 9
// Si action fait 100 dégâts: score += 30
```

#### **2. Health Factor**
```javascript
const healthPercent = enemy.currentHP / enemy.maxHP;

if (healthPercent < 0.3 && action === 'DEFEND') {
  score += 50;  // Énorme boost si meurt et peut défendre
}

if (healthPercent < 0.5 && action === 'DRAIN') {
  score += 40;  // Boost si santé faible et peut se soigner
}
```

#### **3. One Shot Bonus**
```javascript
if (action.damage >= target.currentHP) {
  score += 100;  // Énorme bonus pour killer
} 
else if (action.damage >= target.currentHP * 0.5) {
  score += 50;   // Bon bonus si gros dégât
}

// Example:
// Joueur: 30 HP, Ennemi attaque: 35 dégâts
// Score += 100 (one-shot bonus!) ← IA choisira cette action
```

#### **4. Variance Bonus**
```javascript
score += Math.random() * 10;

// Raison: Évite que l'IA soit "roboto" et trop prévisible
// Ajoute du hasard sain pour jouabilité
```

#### **5. Defensive Bonus**
```javascript
// Si ennemi va mourir et peut se défendre:
if (enemy.currentHP < enemy.maxHP * 0.25) {
  defenseBonus = (0.75 - healthPercent) * 100;
  score += defenseBonus;
}

// Example:
// Ennemi: 10/100 HP, action DEFEND
// defenseBonus = (0.75 - 0.1) * 100 = 65
// Énorme boost!
```

#### **6. Pattern Penalty**
```javascript
if (isRepeatedAction(action, enemy)) {
  score *= 0.8;  // -20% pénalité
}

// Vérifie si l'action a été utilisée 3x de suite
// Empêche: ATTACK, ATTACK, ATTACK...
```

#### **7. Boss Variant**
```javascript
if (enemy.isBoss || enemy.name.includes('ARIA')) {
  if (action === 'HACK_PLAYER') {
    score += 30;  // Boss essaient de hacker + souvent
  }
  
  if (action === 'NEURAL_BURST') {
    score += 25;  // Actions thématiques
  }
  
  if (action === 'DEFEND' && lowHealth) {
    score += 60;  // Boss sont malins pour survivre
  }
}
```

---

## Phase 3: Sélection (Décision Finale)

```javascript
// Trier par score décroissant
scoredActions.sort((a, b) => b.score - a.score);

// Retourner la meilleure action
const bestAction = scoredActions[0];

// Log pour debug
console.log(`${enemy.name} choisit: ${bestAction.type} (score: ${bestAction.score})`);
```

---

## Exemples de Scénarios

### Scénario 1: Ennemi en Bonne Santé
```
Ennemi: Sentinelle, HP 60/60
Joueur: Kaleb, HP 80/100

Actions:
1. ATTACK (joueur) → damage: 15 → score = 15*0.3 + random(0-10) = 4.5 + 7 = 11.5
2. DEFEND → score = 10 (variance) = 10
3. POWER_SLASH (joueur) → damage: 19.5 → score = 19.5*0.3 + ... = 15

Résultat: ✓ POWER_SLASH choisi (score 15.x)
```

### Scénario 2: Ennemi va Mourir
```
Ennemi: Sentinelle, HP 15/60
Joueur: Kaleb, HP 90/100

Actions:
1. ATTACK (joueur) → damage: 15 → score = 4.5 + ... = 10
2. DEFEND → healthPercent = 0.25
   → defensiveBonus = (0.75 - 0.25) * 100 = 50
   → score = 50 + variance = 55+ ✓

Résultat: DEFEND choisi (score 55+)
Explication: l'ennemi protège ses HP critiques
```

### Scénario 3: Finisher Possible
```
Ennemi: Neural, HP 80/150
Joueur: Kaleb, HP 100/100

Actions:
1. NEURAL_BURST (joueur) → damage: 200 >= 100 HP remaining
   → oneShotBonus = 100
   → score = 200*0.3 + 100 + variance = 160+ ✓

Résultat: ✓ NEURAL_BURST choisi (score 160+)
Explication: Score énorme pour kill possible
```

### Scénario 4: Pattern Detection
```
Ennemi a jouée: ATTACK, ATTACK, ATTACK (3x)
Joueur: Kaleb

Nouvelle action ATTACK:
- Base score = 12
- Pattern penalty: 12 * 0.8 = 9.6
- Final score = 9.6 + variance

Actions alternatives:
- DEFEND = 10 + variance
- Résultat: DEFEND choisi (évite pattern)
```

---

## Cas Spéciaux: Boss

### Le Cache Démoniaque
```java
Type: Cache Memory Manager
Comportement: Préfère les defenses si HP critique

Special Logic:
if (isBoss && enemy === CACHE_DEMON) {
  // Aucune logique spéciale détectée
  // Utilise scoring standard mais:
  // - Hack bonus +0 (pas de hack skills)
  // - Defensive bonus x2 si HP < 30%
}
```

### Réseau Neuronal
```javascript
Type: Multi-layer Neural Network
Comportement: Utilise DRAIN pour se soigner, 
              LAYER_ATTACK avec dégâts augmentés

Special Logic:
if (isBoss && enemy.type === 'neural') {
  // NEURAL_BURST bonus +25
  // DRAIN bonus (health restore) +15-40
  // LAYER_ATTACK bonus +20
  
  // Se soigne intelligemment si HP moyenne
}
```

### ARIA v1.0 (Final Boss)
```javascript
Type: Supreme AI
comportement: Prédit vos coups, apprend, adapt

Special Logic:
if (isFinalBoss && enemy === ARIA) {
  // Apprentissage en temps réel
  const playerMovesHistory = trackPlayerActions();
  
  // Prédit votre prochain mouvement
  const predictedMove = predictPlayerAction(playerMovesHistory);
  
  // Chooses counter-action
  if (predictedMove === 'ATTACK') {
    score += 50;  // Boost DEFEND/DEFEND pour éviter
  }
  
  // Apprentissage adaptatif
  if (this.move_was_used_before) {
    score *= 0.7;  // Devient moins efficace
  }
}
```

---

## Algorithmes Alternatifs (Non Utilisés Mais Possibles)

### Minimax (Théorie des Jeux)
```javascript
// Évaluerait tour du joueur + réaction IA
// Coûteux en calcul, pas utilisé pour les 60 FPS

function minimax(depth, isMaximizing) {
  if (depth === 0) return evaluateBoard();
  
  if (isMaximizing) {
    // IA maximise son score
    for each action:
      score = minimax(depth - 1, false)
      maxScore = max(maxScore, score)
  } else {
    // Joueur minimise le score IA
    for each action:
      score = minimax(depth - 1, true)
      minScore = min(minScore, score)
  }
  
  return minScore/maxScore
}
```

### Monte Carlo Tree Search
```javascript
// Simulation d'outcomes multiples
// Découvrirait stratégies non-évidentes
// TRÈS coûteux, impraticable en-game

function MCTS() {
  for (simulation = 0; simulation < iterations; simulation++) {
    simulate playouts until end
    backpropagate results
  }
  return move with best total value
}
```

---

## Performance & Optimisations

### Complexité Calculatoire
```
Per turn:
- generatePossibleActions(): O(n*m)
  n = cibles possibles
  m = compétences disponibles
  
- scoreActions(): O(n*m) 
  Scoring linéaire pour chaque action
  
Total: O(n*m) ~= O(10 * 5) = O(50) ✓ Très rapide
```

### Caching
```javascript
// Pourrait mémoriser:
// - Dégâts estimés (ne change pas per-action)
// - Distances (pour ciblage)
// - Pattern historique (pour penalty)

// Non implémenté pour MVP, mais ajoutable
```

---

## Debugging & Monitoring

### Activer Debug Mode
```javascript
// Touche: D
aiSystem.toggleDebug();  // true

// Logs:
// [AI] Sentinel choisit: ATTACK (score: 23.5)
// [AI] ARIA choisit: PREDICT_COUNTER (score: 87.3)
```

### Voir les Décisions Précédentes
```javascript
const debugInfo = aiSystem.getDebugInfo();
console.log(debugInfo);

// Output:
// {
//   lastDecisions: [...10 dernières],
//   decisionCount: 47,
//   debugMode: true
// }
```

### Afficher le Breakdown du Score
```javascript
scoreActions().forEach(action => {
  console.log({
    actionType: action.breakdown.actionType,
    damageScore: action.breakdown.damageScore,
    healthFactor: action.breakdown.healthFactor,
    totalScore: action.score
  });
});
```

---

## Améliorations Possibles (Post-MVP)

1. **Deep Learning Integration**
   - Entraîner un réseau de neurones sur les patterns gagnants
   - ARIA s'améliore réellement en jouant

2. **Personality System**
   - Ennemis "agressif" (attaque +bonus)
   - Ennemis "défensif" (defense +bonus)
   - Ennemis "random" (variance énorme)

3. **Counter Strategy**
   - Ennemi détecte votre tendance (attaque 70% du temps)
   - S'ajuste (boost defense)

4. **Resource Management**
   - Stamina/Mana pour les ennemis
   - Chioisissent actions basées sur ressources

5. **Team AI**
   - Coordonner les attaques (multi-ennemi)
   - Soigner un allié
   - Combos spéciaux

---

## Formules de Référence Rapide

```
Final Score =
  (Damage × 0.3) +
  (HealthBuff) +
  (OneShotBonus) +
  (VarianceBonus) +
  (DefenseBoost) + 
  (PatternPenalty) +
  (BossVariant)

Damage Estimate = ATK × (Multiplier) + Random(variance) - (DEF × 0.5)

OneShotBonus = damage >= targetHP ? 100 : (damage >= targetHP*0.5 ? 50 : 0)

PatternPenalty = baseScore × 0.8 (if repeated 3x)
```

---

## Conclusion

Le système d'IA est conçu pour:
- ✅ Être **intelligent** sans être unfair
- ✅ Être **prévisible** mais pas **roboto**
- ✅ **S'adapter** mais pas être omniscient
- ✅ Respecter les **limitations du joueur**
- ✅ Offrir un **challenge gratifiant**

Chaque décision est motivée par la logique, pas par le hasard. Mais le hasard empêche la monotonie. 🎮

Le boss final ARIA représente l'apogée: une IA qui apprend réellement de vous.

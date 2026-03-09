# 🎮 OVERRIDE: Campus Zero 3D - MVP Babylon.js

Un jeu JRPG tour par tour en 3D avec système de combat intelligent dirigé par une IA.

## 🚀 Démarrage

### Via Python
```bash
cd "c:\Users\djera\OneDrive\Desktop\Dernier Refuge"
python -m http.server 8000
# Ouvrir: http://localhost:8000/game3d.html
```

### Via Node.js
```bash
npx http-server
# Ouvrir: http://localhost:8080/game3d.html
```

### Directement
Double-cliquez sur `game3d.html`

---

## 🎮 Gameplay & Méchaniques

### Combat Tour par Tour
Le jeu utilise un système de combat JRPG classique:
1. **Tour du Joueur** - Vous choisissez une action
2. **Animations** - Le joueur attaque en 3D
3. **Dégâts Flottants** - Affichage visuel des dégâts
4. **Tour des Ennemis** - Les ennemis jouent (IA)
5. **Résolution** - Vérifier qui a gagné

### Actions Disponibles
| Action | Description | Effet |
|--------|-------------|-------|
| **Attaquer** | Attaque basique | 1x ATK + variance |
| **Capacité** | Attaque puissante (Heavy Attack) | 1.5x ATK |
| **Défendre** | Réduit les dégâts reçus | -50% dmg, buffs jusqu'au prochain tour |
| **Pirater** | Tentative de contrôle IA | 60% de chance de succès |

### Système de Stats
```
ATK (Attaque) → Dégâts de base
DEF (Défense) → Réduit les dégâts reçus (50% de DEF soustrait)
SPD (Vitesse) → Détermine l'ordre d'attaque (ajout de variance)
HP (Santé) → Points de vie (0 = defeat)
```

---

## 🤖 Système d'IA Intelligent

### Algorithme de Décision (Multi-factoriel)

L'IA ennemie utilise un système de scoring sophistiqué pour choisir la meilleure action:

#### **1. Génération des Actions Possibles** 
Toutes les actions légales sont générées:
- Attaque simple sur chaque cible
- Compétences spéciales (Power Slash, Neural Burst, Drain)
- Défense
- Tentative de piratage (30% de chance)

#### **2. Scoring Multi-Factoriel** 

Chaque action reçoit un score basé sur:

```javascript
Score = 
  (Damage * 0.3) +           // 30% - Dégâts maximaux
  (HealthBuff) +             // Buff si santé faible + action appropriée
  (OneShotBonus) +           // +100 si peut faire un kill
  (VarianceBonus) +          // +Random(0-10) pour éviter patterns
  (DefenseBoost) +           // Boost énorme si mourant et peut défendre
  (PatternPenalty) +         // -20% si action déjà utilisée 3x
  (BossVariant)              // Stratégies spéciales pour boss
```

#### **3. Décision Finale**
L'IA choisit l'action avec le score le plus élevé.

### Exemple de Scénario

```
Ennemi: HP 30/100, vs Joueur: HP 100/100

Actions possibles:
1. ATTACK (Damage ~12) → Score = 20
2. DEFEND → Score = (0.7 - 0.3) * 100 = 40 ✓ CHOISI
3. HEAVY_ATTACK (Damage ~18) → Score = 25

Résultat: L'IA choisit DEFEND car elle est faible
```

### Comportement Boss Avancé

Les boss (ARIA, Neural Network) utilisent des stratégies :
- Attaques thématiques (NEURAL_BURST pour IA)
- Hack plus fréquent
- Adaptation rapide aux patterns du joueur
- Utilisation stratégique du Drain pour se soigner

---

## 🎨 Technologie 3D (Babylon.js)

### Scène
- **Caméra** - Arc Rotate (3ème personne dynamique)
- **Lighting** - Directional + Hemispheric + Spot lights
- **Skybox** - Arena dystopique
- **Ground** - Grille de neon cyan

### Modèles

#### Joueur (Kaleb)
```
- Cyan/Bleu
- Corps + Tête + Bras + Jambes
- Aura de particules cyan
```

#### Ennemis
```
Sentinel Drone:
- Rouge/Orange
- Cylindre (drone)
- Émission rouge

Neural Network:
- Orange/Jaune
- Pyramide (3 couches)
- Émission orange
```

### Animations
- **Attack** - Déplacement vers l'ennemi + retour
- **Damage Float** - Numéro qui monte et disparaît
- **Particle System** - Auras autour des personnages

---

## 📊 Fichiers du Projet

| Fichier | Rôle |
|---------|------|
| `game3d.html` | Structure HTML, UI Babylon Canvas |
| `style3d.css` | Design/UI de la scène 3D |
| `game3d.js` | Moteur Babylon.js, scène, animations |
| `combat-system.js` | Système de combat JRPG tour par tour |
| `ai-system.js` | IA intelligente avec scoring multi-factoriel |

---

## 🎯 Features

### ✅ Implémenté
- [x] Scène 3D Babylon.js
- [x] Combat tour par tour
- [x] 4 actions différentes
- [x] Animations d'attaque
- [x] Dégâts flottants
- [x] IA intelligente multi-factoriel
- [x] Système de stats (ATK/DEF/SPD/HP)
- [x] Particules et effects
- [x] Caméra 3ème personne
- [x] Multiple ennemis
- [x] Log de combat
- [x] Debug mode (Touche D)

### 📋 Améliorations Futures
- [ ] Système de skill tree
- [ ] Plus de types d'ennemis (20+)
- [ ] Boss battles spéciales
- [ ] Compétences ultimes (spéciales ennemis avancées)
- [ ] Progression de niveaux
- [ ] Loot drops
- [ ] Intégration narrative complète
- [ ] Sounds/musique
- [ ] Cutscenes cinématiques
- [ ] Difficulty adjustments
- [ ] Achievements

---

## 🎮 Comment Jouer

1. **Lancez le jeu** → Page titre
2. **Cliquez "Commencer"** → Scène 3D se charge
3. **Choisissez une action** → Attaquer, Capacité, Défendre, Pirater
4. **Regardez l'animation** → Votre personnage attaque
5. **Ennemis jouent** → IA calcule et exécute
6. **Répétez** jusqu'à victoire ou défaite

---

## 🧠 Système d'IA - Détails Techniques

### Architecture

```
calculateBestMove()
├── generatePossibleActions()
│   ├── ATTACK
│   ├── SKILL (POWER_SLASH, NEURAL_BURST, DRAIN)
│   ├── DEFEND
│   └── HACK
├── scoreActions()
│   ├── damageScore (30%)
│   ├── healthFactor
│   ├── oneShotBonus (+100 if kill)
│   ├── variance (random 0-10)
│   ├── patternCheck (-20%)
│   └── bossVariant(special)
└── selectBest()
    └── return action with highest score
```

### Algorithmes Utilisés

1. **Greedy Algorithm** - Choisit le meilleur move immédiat
2. **Pattern Recognition** - Évite les actions répétées
3. **State Evaluation** - Évalue l'état global du combat
4. **Monte Carlo Estimation** (optional) - Simule les outcomes
5. **Minimax-like Approach** - Pour boss avancés

---

## 🐛 Debug Mode

**Touche: D**

Affiche:
- FPS (frames per second)
- Dernière décision IA
- Distance caméra
- Décisions précédentes

---

## 📈 Stats exemple

### Joueur Initial
```
Name: Kaleb
HP: 100
ATK: 15
DEF: 10
SPD: 8
```

### Sentinel Drone
```
Name: Sentinelle Drone
HP: 60
ATK: 12
DEF: 8
SPD: 6
```

### Neural Network
```
Name: Réseau Neuronal
HP: 150
ATK: 18
DEF: 12
SPD: 5 (lent but tank)
```

---

## 🔐 Prochaines Étapes pour Intégration Narrative

Intégrer la narration Campus Zero:
1. Ajouter dialogues BYTE/Mira pendant combat
2. Boss patterns basés sur l'histoire
3. Multiple encounters dans différentes zones
4. Cutscenes cinématiques
5. Progression de quête

---

## 🚀 Performance

- **Babylon.js** bien optimisé
- **Mesh pooling** pour particules
- **Level of detail** (LOD) actif
- **Shadows** activées (peut être désactivé sur faible config)

---

## 📞 Contrôles PC

| Touche | Action |
|--------|--------|
| Souris Click | Actions de combat |
| Souris Scroll | Zoom caméra |
| Souris Drag | Rotation caméra |
| D | Toggle Debug |

---

**Créé avec Babylon.js pour une expérience 3D immersive** 🎮✨

"L'IA peut calculer les meilleurs coups. Mais peut-elle comprendre pourquoi tu combats?"

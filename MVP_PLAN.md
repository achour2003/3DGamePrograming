# 🎮 OVERRIDE: Campus Zero — Plan MVP

Basé sur le cahier des charges — **P0 Prototype + P1 Vertical Slice**

---

## 📊 État Actuel vs Cahier des Charges

### ✅ CE QUI EXISTE DÉJÀ

| Composant | Statut | Détails |
|---|---|---|
| **Moteur BabylonJS** | ✅ Fonctionnel | Scène 3D, caméra TPS, lighting, skybox |
| **Modèles 3D** | ✅ Basique | Kaleb, ennemis (sentinel/neural/aria) — géométries primitives |
| **Combat Tour par Tour** | ✅ 80% | Système de base functional, IA multi-factorielle |
| **Animations** | ✅ Partiel | Attaques, dégâts flottants, particules |
| **HUD Combat** | ✅ Basique | HP bars, actions, log |
| **Enemis & Templates** | ✅ 11 ennemis | Configs existantes |

### ❌ CE QUI MANQUE (MVP P0 + P1)

| Système | Importance | Complexité |
|---|---|---|
| **🎮 Système BYTE** | 🔴 CRITIQUE | Hautes — banque de défis, validation, récompenses |
| **🔓 Hacking (mini-puzzle)** | 🔴 CRITIQUE | Haute — mini-jeu de connexion réseau |
| **💎 Items & Fragments de Code** | 🔴 CRITIQUE | Moyenne — système de monnaie de progression |
| **📈 Arbre de Compétences** | 🔴 CRITIQUE | Haute — déblocages, améliorations |
| **🎭 Dialogues & Choix** | 🟠 HAUTE | Haute — arbre narratif, triggers |
| **🤖 BYTE Compagnon** | 🟠 HAUTE | Moyenne — modèle 3D, animations, UI interaction |
| **🗺️ Mode Exploration** | 🟠 HAUTE | Très Haute — déplacement libre, événements, zones |
| **🎨 Direction Artistique** | 🟡 NORMALE | Moyenne — éclairage, post-processing, couleurs |
| **🔊 Audio (placeholder)** | 🟡 NORMALE | Moyenne — musique adaptative, SFX |
| **📱 Sauvegades** | 🟡 NORMALE | Basse — localStorage/IndexedDB |

---

## 🎯 Scope MVP par Phase

### P0 — Prototype (3 semaines)

**Objectif:** Proof of Concept de toutes les mécaniques essentielles

| Système | État cible | Fichiers |
|---|---|---|
| **Scène 3D** | 1 zone simple (salle blanche) | game3d.js ✅ |
| **Personnage** | Kaleb qui se déplace, animations basiques | enemy-templates.js ✅ |
| **Combat** | Tour par tour complet, 3 ennemis | combat-system.js ✅ |
| **IA Ennemie** | Scoring multi-factoriel | ai-system.js ✅ |
| **Hacking** | Mini-puzzle fonctionnel (pas d'art) | **NEW: hacking-system.js** |
| **BYTE** | Compagnon basique, 3 défis informatiques | **NEW: byte-system.js** |
| **Progression** | Fragments de Code, 1 compétence débloquable | **NEW: progression-system.js** |
| **Dialogues** | Chat simple avec BYTE (pas d'arbre) | **NEW: dialogue-system.js** |

**Résultat P0:** Joueur peut combattre, pirater des ennemis, répondre aux défis BYTE, débloquer une compétence, parler à BYTE. **Solution cubique, pas d'art.**

### P1 — Vertical Slice (6 semaines)

**Objectif:** 1 zone complète du cahier (Bâtiment Sciences) avec art direction

| Système | État cible |
|---|---|
| **Zone 1 (Bâtiment Sciences)** | Entièrement explorable, 4 combats, 3 nœuds BYTE, 1 boss |
| **Boss 1 (Demon du Cache)** | Design complet, 2 phases, mécaniques spéciales |
| **BYTE** | Modèle 3D complet, animations, hologrammes, dialogues progressifs |
| **Dialogues** | Arbre narratif Acte 1 complet, 3+ endings différents |
| **Compétences** | 5–7 compétences débloquables |
| **Art Direction** | Éclairage néo-obscur, couleurs cahier (bleus ARIA + ambres humains) |
| **Post-Processing** | Bloom, SSAO, god rays dans les corridors |
| **Audio** | 2–3 musiques de zone, SFX combat, voix ARIA (synthétisée) |
| **Sauvegarde** | 1 slot de sauvegarde automatique |

**Résultat P1:** Une démo jouable de 30–45 min. Tout le art direction. Prêt à étendre aux autres actes.

---

## 🏗️ Architecture Modules Requis

```
src/
├── game3d.js              ✅ EXISTE - Moteur BabylonJS
├── combat-system.js       ✅ EXISTE - Combat tour par tour
├── ai-system.js           ✅ EXISTE - IA ennemies
├── enemy-templates.js     ✅ EXISTE - Configs
├── style3d.css            ✅ EXISTE - HUD styling
├── game3d.html            ✅ EXISTE - HTML structure
│
├── hacking-system.js      ⭐ NEW - Mini-puzzle de connexion
├── byte-system.js         ⭐ NEW - Défis informatiques
├── progression-system.js  ⭐ NEW - Fragments + Compétences
├── dialogue-system.js     ⭐ NEW - Dialogues & choix
├── scene-manager.js       ⭐ NEW - Gestion des scènes
├── quest-system.js        ⭐ NEW - Quêtes narratives
├── inventory-system.js    ⭐ NEW - Items, équipement
│
├── data/
│   ├── challenges.json    ⭐ NEW - 30 défis BYTE
│   ├── dialogue-trees.json ⭐ NEW - Arbre narratif
│   ├── skills-tree.json   ⭐ NEW - Compétences débloquables
│   └── zones/
│       └── building-science.json ⭐ NEW
│
└── assets/
    ├── models/
    │   ├── kaleb.glb              (prototype: cube coloré)
    │   ├── byte.glb               ⭐ NEW (prototype: pyramide)
    │   └── enemies/
    │
    ├── textures/
    │   ├── neon-grid.png
    │   └── student-casque.png     ⭐ NEW
    │
    └── audio/ (placeholder pour MVP)
        ├── zone-science.mp3
        └── combat-default.mp3
```

---

## 📝 Tasks Détaillées (Ordre de Priorité)

### Phase P0 — Prototype (Semaines 1–3)

#### **Semaine 1 — Fondations Système**

- [ ] **Hacking System** (day 1-2)
  - Mini-puzzle: grille de nœuds (4x4 ou 3x3)
  - Joueur doit connecter nœuds dans l'ordre pour "cracker"
  - Timer de 10 secondes — succès = ennemi retourné
  - Intégration au système de combat

- [ ] **BYTE System** (day 2-3)
  - Créer `byte-system.js` avec classe `ChallengeSystem`
  - Banque de 30 défis (pour P1) — pour MVP, 3 défis hardcodés
  - Méthode `validateAnswer(categoryKey, answer)` → bool
  - Distribution des Fragments de Code (2–3 par défi)

- [ ] **Progression System** (day 3-4)
  - Classe `ProgressionSystem` : gère Fragments + Compétences
  - Inventaire local (localStorage): `{ fragments: 50, skills: [...] }`
  - 5 compétences de base (3 combat, 1 hacking, 1 analyse)
  - Chacune coûte 10 / 20 / 50 Fragments

- [ ] **Dialogue System** (day 4-5)
  - JSON simple pour dialogues
  - Parser et affichage modal
  - Pour MVP: BYTE explique les règles du jeu (tutoriel)
  - Plus tard: arbre narratif complet

#### **Semaine 2 — Intégration Combat**

- [ ] **Enrichir CombatSystem.js**
  - Ajouter action "Hack" au menu
  - Intégrer hacking-system.js au tour de Kaleb
  - Succès de hack = ennemi passe à côté joueur pour 2 tours
  - Ajouter Jauge de Synchronisation (BYTE) — remplie si hack réussi

- [ ] **Tester 1 combat complet** (cycle de test)
  - Kaleb vs Sentinel Drone + Converted Student
  - Tester: attaque, hack, compétence, défense
  - Éviter les bugs d'UI, de tour, de dégâts

- [ ] **BYTE comme PNJ** (day 9-11)
  - Apparition simple (cube vert rotant en haut de l'écran)
  - Dialogue au démarrage du combat: "Je suis BYTE, ton compagnon. Répondre aux défis te donne des Fragments"
  - Bouton "Défi BYTE" pendant combat (optionnel, pas de temps limite)

#### **Semaine 3 — Polish P0**

- [ ] **Intégrer progression** dans l'UI
  - Afficher le compteur de Fragments en bas à droite
  - Menu "Compétences" accessible (touche C) — affiche arbre, coût en Fragments
  - Déblocage fonctionnel de compétences

- [ ] **Testing & Bugs**
  - Play-test une partie complète
  - Logs en console pour tracer IA, hacking, progression
  - Doc rapide du système

- [ ] **Livrable P0**
  - 1 fichier HTML qui charge tout
  - 6 JS modules ✅ (game3d, combat, ai, enemies, hacking, byte) + progression + dialogue
  - 1 combat entièrement fonctionnel
  - README court: "P0 — Combat Prototype"

---

### Phase P1 — Vertical Slice (Semaines 4–9)

#### **Semaine 4 — Scène & Exploration**

- [ ] **Scene Manager** (day 1-3)
  - Remodeler game3d.js pour séparer exploration/combat
  - État global: `GAME_STATE = { phase: "exploration" | "combat" }`
  - Switch scene au contact d'un ennemi

- [ ] **Bâtiment Sciences** (day 3-6)
  - Recréer étage du bâtiment en BabylonJS
  - Corridors simples (400 units², 10 corridors)
  - 4 salles (défis BYTE), 1 arène de boss
  - Nœuds BYTE visibles (cubes verts avec bounding box de 5 units)
  - Collisions pour éviter de passer les murs

- [ ] **Déplacement Kaleb** (day 6-7)
  - WASD + souris pour rotation caméra
  - Vitesse adjustable
  - Animation de marche

#### **Semaine 5 — Contenu Acte 1**

- [ ] **Dialogues Acte 1** (day 1-4)
  - Arrivée de Kaleb (cinématique? ou simple dialogue)
  - 5–6 points de dialogue clés (rencontre BYTE, premier défi, révélation ARIA…)
  - JSON simple avec choix (max 2–3)

- [ ] **Nœuds BYTE** (day 4-6)
  - 3 nœuds BYTE disparés dans le bâtiment
  - Défi 1: O(n) complexity
  - Défi 2: What is TLS layer?
  - Défi 3: Overfitting definition
  - Chaque réussite = +20 Fragments + BYTE dialogue

- [ ] **4 Combats Acte 1** (day 6-7)
  - C1: 2 Sentinel Drones (facile, tutoriel)
  - C2: 1 Converted Student + 1 Sentinel (moyen)
  - C3: 2 Infected Drones (difficile)
  - C4: Boss — Le Démon du Cache

#### **Semaine 6–7 — Boss & Mécaniques Avancées**

- [ ] **Boss 1 Design** (day 1-5)
  - Nom: "Le Démon du Cache" (Cache Demon)
  - Mécanique: chaque tour, bloque aléatoirement 2 compétences de Kaleb
  - Indicateur visuel: X rouge sur compétences bloquées
  - Faiblesse: attaquer quand sa barre de buffer est pleine (visual indicator)
  - Phase 1: 100 HP, 3 compétences bloquées possible
  - Phase 2 (< 50 HP): 4 compétences bloquées possible, attaque 2x
  - Dialogue avant/après: ARIA parle à travers le boss

- [ ] **Compétences Acte 1** (day 5-7)
  - Débloquable via Fragments:
    - Attaque Électrique (20 Frags): 1.5x dégât
    - Piratage Silencieux (30 Frags): Hack avec + 30% succès
    - Scan Vulnérabilité (50 Frags): voir les HP ennemis (toujours)
  - Total accessible ~150 Fragments en Acte 1 → 2–3 compétences max

#### **Semaine 8 — Art Direction**

- [ ] **Éclairage Néo-Obscur** (day 1-3)
  - Augmenter intensity des lumières
  - Ajouter god rays (volumetric) vers les fenêtres
  - Ombres dynamiques (shadow maps) pour tous les emissives
  - Test sur la zone Bâtiment Sciences

- [ ] **Couleurs Cahier** (day 3-5)
  - Palette CSS: Bleu ARIA (#2E86DE), Ambre Humain (#F97316), Vert BYTE (#10B981)
  - Appliquer aux matériaux 3D: casques bleus, leds ambre/vertes
  - Néons du sol (cyan #48CAE4) animés — pulsent lentement
  - Étudiants "infectés" = lueur bleue autour du corps

- [ ] **Post-Processing** (day 5-7)
  - Bloom sur tous les IA (casques, ARIA hologramme)
  - Vignette légère autour des écrans
  - Légère aberration chromatique (optional)
  - FPS > 60 sur machine moyenne

#### **Semaine 9 — Audio & Polish**

- [ ] **Musique Acte 1** (day 1-3)
  - 1 track pour exploration (piano lent + synth froid)
  - 1 track pour combat standard (électro + cordes)
  - 1 track pour boss final (épique)
  - Transition fluide entre zones
  - Utiliser Howler.js pour gestion de l'audio

- [ ] **SFX** (day 3-5)
  - Son de coup/attaque
  - Son de hack réussi/échoué
  - Voix synthétisée pour ARIA (texte → speech simple)
  - Notifications BYTE

- [ ] **QA & Optimisation** (day 5-7)
  - Play-test une partie entière
  - Profiling FPS
  - Lister les bugs critiques vs polish

---

## 📦 Dependencies & Stack

```json
{
  "babylon": "7.x",
  "typescript": "5.x",
  "vite": "latest",
  "howler": "2.x",
  "gsap": "3.x" (optional, pour animations UI)
}
```

**CLI commands (pour P1 minimum):**
```bash
npm install babylon howler gsap
npx vite
# → http://localhost:5173
```

---

## 🎨 Ressources Placeholder pour MVP

| Asset | Source Temporaire | Final |
|---|---|---|
| Modèle Kaleb | Cube bleu animé | Mixamo export |
| Modèle BYTE | Pyramide verte | Custom low-poly |
| Bâtiment Sciences | Box simples + colliders | Blockout puis détails |
| Casques NeuralSync | Cubes bleus | Modèles détaillés |
| Textures | Couleurs unie | PBR textures Poly Haven |
| Musique | Silence | Musique original / royalty-free |

---

## ✅ Checklist P0 — Prêt pour P1

- [ ] 1 zone minimaliste (salle blanche ou bâtiment simple)
- [ ] Kaleb qui se déplace et peut combattre
- [ ] 3 ennemis différents
- [ ] Système de hacking fonctionnel
- [ ] 3 défis BYTE avec validation
- [ ] Progression par Fragments fonctionnelle
- [ ] 3 compétences débloquables
- [ ] BYTE présent et parlant
- [ ] 1 combat facile, 1 moyen, 1 difficile (vs boss basique)
- [ ] UI lisible et responsive
- [ ] Pas de crash en boucle 30 min
- [ ] Console clean (pas d'erreurs rouges)

---

## ✅ Checklist P1 — Démo Jouable

- [ ] Bâtiment Sciences explorable (400+ units²)
- [ ] 4 combats Acte 1 + boss avec 2 phases
- [ ] 3 nœuds BYTE dans la zone
- [ ] Dialogues Acte 1 (5–6 scènes, 2–3 choix)
- [ ] 3–5 compétences débloquables
- [ ] Art direction complète (éclairage, couleurs)
- [ ] Post-processing et effets visuels
- [ ] Audio (musique 3 tracks, SFX de base)
- [ ] Sauvegarde automatique
- [ ] Fin claire (victoire contre boss?)

---

## 📊 Estimation Effort

| Phase | Durée | Ressource |
|---|---|---|
| **P0 Prototype** | 3 semaines | 1 dev (full-time) |
| **P1 Vertical Slice** | 6 semaines | 1 dev + 1 artist (part-time) |
| **Total MVP** | 9 semaines | 1 dev, 0.5 artist |

**Pairing recommendation:**
- Dev principal: programmation système, integration
- Artist (optional): modèles BYTE, boss, textures Bâtiment

---

## 🚀 Prochaines Étapes Immédiates

1. **Créer** `hacking-system.js` ← START HERE
2. **Créer** `byte-system.js`
3. **Créer** `progression-system.js`
4. **Enrichir** `combat-system.js` avec intégrations
5. **Tester** 1 combat complet P0
6. **Valider** avant P1

---

**Generated:** Mars 2026 | **Status:** READY FOR DEVELOPMENT | **Version:** 1.0

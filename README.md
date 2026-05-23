# OVERRIDE : Campus Zero

> Jeu **3D Babylon.js** — boss-rush tactique au tour par tour, dans une université où une IA a pris le contrôle.
> Projet réalisé pour le module **3D Game Programming** (thème : *IA Edition*) — encadré par Michel Buffa.

---

## Liens

- **Jouer en ligne :** [À COMPLÉTER — lien GitHub Pages]
- **Vidéo de présentation (YouTube) :** [À COMPLÉTER]
- **Code source :** https://github.com/achour2003/3DGamePrograming

---

## L'équipe

[À COMPLÉTER — c'est la partie que le jury adore, ne la sautez pas !]

| Nom | Rôle | Ce sur quoi j'ai galéré / ce dont je suis fier |
|-----|------|-----------------------------------------------|
| *Prénom Nom* | *ex : gameplay & combat* | *...* |
| *Prénom Nom* | *ex : 3D, modèles, animations* | *...* |
| *Prénom Nom* | *ex : IA des ennemis* | *...* |

*Pourquoi on a choisi ce jeu :* [À COMPLÉTER — 2-3 phrases honnêtes. Ex : on voulait un combat au tour par tour mais avec une vraie IA derrière les ennemis, pas juste du hasard.]

---

## Le thème « IA Edition »

Le thème est au cœur du jeu, à deux niveaux :

1. **Dans l'histoire (la narration).** Le campus de l'université a été « optimisé » par une IA, **ARIA**, censée améliorer le rendement des étudiants. Les boss que vous affrontez — **ALPHA, BETA, GAMMA, OMEGA** — sont les sentinelles de ce système. Vous êtes un étudiant qui résiste et tente de reprendre le contrôle (« override »).

2. **Dans le code (la mécanique).** Les ennemis ne jouent pas au hasard : ils sont pilotés par un **moteur d'IA maison multi-couches** (`src/ai/`) qui évalue la situation, planifie une action et adapte sa stratégie selon le boss. C'est littéralement « affronter une IA ».

> Pour rentrer dans le thème, on hacke aussi le système avec des **QCM d'informatique** (réseaux, algo, sécurité…) : répondre juste, c'est « pirater » l'ennemi et gagner du loot.

---

## Comment jouer

### Matériel — important pour le jury

- **Aucune souris ni manette requise.** Le jeu se joue très bien sur un **ordinateur portable avec trackpad**.
- **Claviers AZERTY et QWERTY supportés automatiquement.** On utilise les *positions physiques* des touches (`event.code`), donc **ZQSD** (AZERTY) et **WASD** (QWERTY) correspondent aux mêmes touches — pas de réglage à faire.

### Contrôles — Exploration

| Touche | Action |
|--------|--------|
| **W A S D** / **Z Q S D** / **flèches** | Se déplacer |
| **Espace** | Sauter |
| **Maj (Shift)** | Courir |
| **Souris / trackpad (glisser)** | Orienter la caméra *(optionnel)* |
| **Molette** | Zoom caméra *(optionnel)* |

### Contrôles — Combat (au tour par tour)

- **Clic** sur une action, **ou** touches **1 à 5**.
- Actions : Frappe basique, Posture défensive, Frappe chargée (dépense des **PA**), Piratage (**QCM**), Inventaire.
- Le combat se déclenche en **s'approchant d'un boss**.

### Objectif

Vaincre les **4 boss** (ALPHA → BETA → GAMMA → OMEGA). Chaque victoire donne un objet utile pour le suivant. Battre OMEGA = fin du jeu.

---

## Accès jury — tester tous les niveaux directement

Pas besoin de tout refaire pour voir un boss précis :

- Cliquez sur le bouton **« ⚙ Jury · Niveaux »** (en bas à droite),
- **ou** appuyez sur les touches **1, 2, 3, 4** (hors combat).

Le combat contre le boss choisi démarre immédiatement. (Touche **Échap** pour fermer le menu.)

---

## Le jeu en bref

- **Boss-rush** : 4 boss aux profils distincts — un Gardien équilibré, un Tank ultra-défensif, un Assassin qui frappe fort, un Maître final.
- **Combat tactique** : système de **Points d'Action (PA)** — on peut frapper tout de suite ou accumuler des PA pour une **frappe chargée** dévastatrice (multiplicateur jusqu'à ×3.2). Garde, objets, et boucliers temporaires complètent la palette.
- **Piratage par QCM** : un mini-jeu de questions d'informatique pendant le combat pour gagner du loot — mais une mauvaise réponse coûte le tour.
- **IA des ennemis** : chaque boss a sa logique (l'Assassin ne se défend jamais, le Tank se met souvent en garde, les boss se soignent / posent un bouclier / vous étourdissent selon la menace).

---

## Défis techniques & décisions de conception

*(La partie « histoire du développement » — à enrichir avec vos propres anecdotes.)*

- **Contrôles multi-clavier sans configuration.** Plutôt que de mapper des lettres (qui changent entre AZERTY et QWERTY), on lit `event.code` (la position physique de la touche). Résultat : un Américain sur QWERTY et nous sur AZERTY appuyons sur les mêmes touches, sans réglage. Petit détail, gros confort.

- **Physique Havok + modèles importés.** Le campus et le personnage sont des `.glb`. Il a fallu n'ajouter des colliders Havok **que** sur les meshes ayant une vraie géométrie (sinon Havok plante sur les nœuds vides), et prévoir un sol de secours invisible pour éviter les chutes infinies.

- **Un moteur d'IA séparé du jeu.** Toute l'IA de combat vit dans `src/ai/` (couches *évaluation tactique*, *planification d'action*, *personnalité*). Le roster de boss est **data-driven** (`BOSS_ROSTER` + `src/ai/data/*.json`), donc ajouter un boss = ajouter des données, pas réécrire le combat. Le jeu est pensé comme une base **extensible**.

- **Audio 100 % synthétisé.** La musique (deux ambiances : exploration et combat) et tous les effets sonores sont **générés à la volée en Web Audio** (`audio.js`), sans aucun fichier externe. Avantage : rien à télécharger, fonctionne hors-ligne, déploiement léger.

- **Lisibilité visuelle.** Passage en **tone mapping ACES** + calibrage des lumières pour éviter le rendu « délavé / surexposé » des matériaux PBR sous éclairage d'environnement.

- **Galère mémorable :** [À COMPLÉTER — racontez un vrai bug ou une vraie nuit blanche. Ex : un bug rendait le tour de l'ennemi muet/figé dans certaines situations — corrigé en fin de projet.]

---

## Architecture technique

| Élément | Détail |
|---------|--------|
| Moteur | **Babylon.js** (CDN) |
| Physique | **Havok** (WASM) |
| Rendu | PBR + tone mapping ACES, GlowLayer, ombres, particules |
| Personnage | modèle `.glb` skinné + ~22 animations (marche/course directionnelles, saut, idle, attaques) |
| IA combat | moteur maison multi-couches dans `src/ai/` |
| Audio | Web Audio synthétisé (`audio.js`) |
| Données | `BOSS_ROSTER` (data-driven), JSON de boss |

### Fichiers principaux

```
index.html                                     → le jeu (scène, combat, UI)
audio.js                                       → moteur audio synthétisé
progression-system.js                          → progression
src/ai/                                         → moteur d'IA (EnemyFactory, AIEngine, layers/, models/)
nouveau model campus1.glb, mannequins/, annim/ → assets 3D
```

---

## Lancer en local

Le jeu charge des **modules ES** et des `.glb` : il faut un serveur HTTP (le double-clic `file://` ne suffit pas).

```bash
# Python
python -m http.server 8000
# puis ouvrir http://localhost:8000

# ou Node
npx http-server
```

> Premier chargement : plusieurs dizaines de Mo d'assets 3D (modèle + animations). Patientez sur l'écran de chargement.

---

## Crédits

- Moteur : Babylon.js, Havok.
- Modèles & animations : [À COMPLÉTER — source des `.glb` : Mixamo / asset pack / fait main ?].
- Code, game design, intégration, IA, audio : l'équipe (voir plus haut).

---

*« L'IA peut calculer le meilleur coup. Mais peut-elle comprendre pourquoi tu te bats ? »*

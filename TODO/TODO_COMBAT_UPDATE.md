# TODO LIST : INTÉGRATION DE LA MISE À JOUR "CAMPUS IA"

## PHASE 1 : Mises à jour des Modèles et Core Logic
- [x] **Modifier `Entity.js`**
  - [x] Changer la valeur par défaut des PA à 0.
  - [x] Ajouter une contrainte stricte empêchant les PA de dépasser 6.
- [x] **Modifier `Skill.js`**
  - [x] Ajouter la propriété `paGain` (Intéger, défaut 0).
  - [x] Ajouter la propriété `costType` (String: 'fixed' ou 'all').
  - [x] Ajouter la propriété `exponentialScaling` (Float, défaut 1.0).
- [x] **Mettre à jour le calcul des dégâts (`Entity.js` / Système de combat)**
  - [x] Implémenter la formule : `dégâts = base * (scaling ^ (paUtilises - 1))` pour les attaques chargées conditionnelles (`costType: 'all'`).

## PHASE 2 : Implémentation du "Utility AI" et des JSONs
- [x] **Mettre à jour `ActionPlanner.js` (Couche 1)**
  - [x] Permettre au buffer de PA simulé d'augmenter si une action a `paGain > 0`.
  - [x] Adapter la logique de 'backtracking' pour qu'elle ne s'arrête pas à 0 PA si des skills gratuits génèrent des PA.
- [x] **Mettre à jour `TacticalEvaluator.js` (Couche 2)**
  - [x] Ajouter une méthode `evaluateUtilityRules(entity, gameState)`.
  - [x] Intercepter le scoring classique : Si une règle du JSON est valide (ex: HP < 30%), renvoyer directement le score de `priority` défini dans la règle.
- [x] **Créer le fichier JSON du Boss "L'IA Doyenne"**
  - [x] Créer `boss_doyenne.json` en utilisant les paramètres du Cahier des Charges.
  - [x] Ajouter le bloc `utility_rules` pour les soins (Patch de sécurité) et Attaque Ultime si joueur a 6 PA.

## PHASE 3 : Graphismes et Animations (3D - BabylonJS)
- [x] **Clonage du Mesh Joueur**
  - [x] Dans `babylon_game.js` (ou module d'instanciation), charger le mesh du Joueur et le cloner pour l'Ennemi.
  - [x] Appliquer un Material/Shader spécifique à l'ennemi (Effet Hologramme / Glitch / Rouge) pour le distinguer.
- [x] **Gestion du Timing Aléatoire**
  - [x] Créer un Timer asynchrone avant l'exécution du plan de l'IA (entre 0.5s et 2.5s).
  - [x] Jouer l'animation d'Idle ou de déplacement pendant cette attente.
- [x] **Implémentation des Feintes (Baits)**
  - [x] Programmer la condition de feinte (ex: `if (Math.random() < 0.3)`).
  - [x] *Processus Feinte :* Lancer Animation Attaque -> Attendre 0.2s -> Stop Animation -> Revenir Idle -> Attendre délai court -> Lancer Vraie Animation Attaque.

## PHASE 4 : Mécanique Temps Réel (Géré hors AI Engine)
- [x] **Système de Parry (Parade)**
  - [x] Ajouter un Event Listener sur les Inputs clavier/souris qui ne s'active *que* lors de l'animation d'attaque du Boss.
  - [x] Ajouter un marqueur visuel / audio 0.1s avant l'impact de l'animation (Anim Event).
  - [x] Créer le calcul de timing :
      - *Si input pendant la frame de 0.3s ->* Parade Parfaite (0 degât + 1 PA).
      - *Si input à côté mais dans une marge de 0.6s ->* Parade Basique (-50% degâts). (Opté pour "trop tôt = Miss", plus punitif)
      - *Sinon ->* Dégâts totaux subis.

## PHASE 5 : Système de QCM et Objets
- [x] **UI du QCM**
  - [x] Créer le panneau UI / Canvas de l'interrogation (QCM).
  - [x] Lier la pause du moteur de jeu (`engine.stopRenderLoop()` ou gestion Custom du temps) à l'affichage de l'interface.
- [x] **Logique de la Mécanique QCM**
  - [x] Ajouter un compteur "QCM Utilisés" (max 2) dans les stats de combat du joueur.
  - [x] Mettre en place la distribution aléatoire de questions.
  - [x] Si Succès (hors temps imparti ou 15 sec check) : Ajouter `HEALTH.exe` ou `Double_Thread.exe` à l'inventaire / Hotbar temporaire du combat.

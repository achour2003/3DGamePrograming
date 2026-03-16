# TODO MIGRATION IA DE COMBAT

## Phase 1 : Mise à niveau des Fondations (Objets du Modèle)
- [x] **Tâche 1.1 - Migration de la classe Entity**
  - Ajouter la gestion des Points d'Action (PA, modifiables et régénérables).
  - Ajouter la jauge de rupture (Break/stability) et ses seuils (stability_max).
  - Intégrer les modificateurs de dégâts (faiblesses/résistances + gestion des weakpoints (points faibles).
  - Ajouter un tableau structuré statusEffects avec gestion du tick temporel tickStatuses().
  - Intégrer un buffer historique (actionHistory) pour limiter à N actions (utile pour l'IA adaptative).
- [x] **Tâche 1.2 - Création de la classe Skill (Capacité)**
  - Concevoir la structure de base : Acteur, Coût en PA, Puissance, Type de cible (self, aoe, single).
  - Intégrer les comboTags (opener, follow_up, finisher) pour l'évaluation textuelle tactique.
  - Gérer les cooldowns (currentCd, tickCooldown()) et ajouter la prise en charge d'interruption/télégraphe (ex: interruptible, telegraph_duration_ms).

## Phase 2 : Couche 1 — Le Générateur de Contraintes (ActionPlanner)
- [x] **Tâche 2.1 - Implémentation du moteur de parcours combinatoire (_enumerate)**
  - Récursivité générant des plans complets dans l'enveloppe limitante de PA restants sans excéder le budget.
  - Placer une sécurité anti-crash (Profondeur max: 3 actions / Cap fixe de sécurité ex: 500 nodes).
- [x] **Tâche 2.2 - Programmation des Contraintes dures**
  - Règle native : Bloquer l'utilisation d'actions en cooldown ou l'usage multiple du même auto-buff.
  - Règles externes (JSON) : Implémenter les "constraints" (go_defensive_if_hp_below, no_repeat_same_skill, reserve_pa_for_reaction).
- [x] **Tâche 2.3 - Résolution des cibles logiques**
  - Déclinaison du "plan de jeu" par cibles légales (le Joueur (Elior/Mira) vs soi-même ou ses copains IA).

## Phase 3 : Couche 2 — L'Évaluateur Tactique (TacticalEvaluator)
- [x] **Tâche 3.1 - Scoring Analytique : Dégâts et Stabilité (Rupture)**
  - Formule formelle avec impact direct : Dégâts = (Puissance * Stat.ATK) modifiée (Parades, Buffs) + WeakPoints.
  - Rapprocher les dégâts ciblés avec le stability_damage_table (énorme bonus si permet un "Break").
  - Calcul de l'élimination (One/Shot target bonus massif).
- [x] **Tâche 3.2 - Scoring d'Effets et Combos Stratégiques**
  - Définir des valeurs heuristiques pour les statuts asymétriques (Stun: +35, PurgeBuff: +20, VolPA).
  - Détection structurelle du "Combo Bonus" : Opener puis Follow_up, Dot puis Pressure, etc.
- [x] **Tâche 3.3 - Prédiction Joueur avancée (Minimax partiel)**
  - Scanner le buffer actionHistory d'Elior via l'IA ennemie (prediction_depth).
  - Accorder des bonus à soi-même face à l'historique : le joueur attaque 80% du temps ? Bonus aux actions "Buff Def" de l'ennemi. Joueur défensif ? Bonus aux frappes imparables.
  - Malus anti-boucle : l'IA perd gravement des points si elle rejoue un pattern récent pour se forcer à s'adapter (robot imprévisible).

## Phase 4 : Couche 3 — Le Contrôleur de Personnalité (PersonalityController ou ActionSelector)
- [x] **Tâche 4.1 - Tireur Probabiliste (Wheel Selection)**
  - Charger l'intelligence action_config : utiliser les pourcentages liés au niveau du monstre (action_distribution_by_level).
  - Extraire avec probabilité aléatoire asymétrique une action du "Top score tactique" pour simuler une intelligence relative.
- [x] **Tâche 4.2 - Gestion des Transitions de Phase du Combat (checkPhaseTransition)**
  - Capteur interne lié au pool de phase (ex: trigger_hp_percent).
  - Modifier le set de capacités, booster les stats (Vit) et changer le profil de sélection "pondéré".
- [x] **Tâche 4.3 - Réactions Événementielles Prioritaires (Hors Arbre IA)**
  - Branchements des règles réactives (on_perfect_parry_received, on_break, ou on_mira_scan) et substitution instantanée de l'action sélectionnée.

## Phase 5 : Usine à Ennemis et Raccordement
- [x] **Tâche 5.1 - Implémentation Factory & Structure JSON**
  - Mettre en relation BabylonJS avec les data/enemies/*.json.
  - Charger et mapper rootkit_alpha (ou autre) dans l'objet métier de type Enemy.
- [x] **Tâche 5.2 - Binding final à la boucle 3D**
  - Communiquer avec CombatSystem.js pour lancer physiquement l'algorithme "ActionPlanner -> Evaluator -> Selector".
  - Jouer correctement le visuel asynchrone (telegraph duration, display label type 'PURGE') ou passer dans les UI HUD.

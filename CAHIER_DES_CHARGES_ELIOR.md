# Cahier des Charges - Elior / Cyber-RPG BabylonJS

## 1. Objet du document

Ce document definit le cadre de production d'un RPG 3D BabylonJS a l'identite cyber-dystopique, avec exploration en temps reel et combats tactiques reactifs inspires du rythme d'un RPG au tour par tour cinematographique moderne, sans recopier une oeuvre existante.

Le document sert a:

- fixer la vision de gameplay;
- definir le protagoniste Elior et ses mouvements;
- decrire les personnages allies, notamment Mira et le robot compagnon;
- etablir la logique d'animation, de transitions et de combat;
- poser une base exploitable pour la production technique, artistique et design.

## 2. Vision du jeu

### 2.1 Fantasy de jeu

Le joueur incarne Elior, un operateur de terrain capable d'exploiter des failles, de casser des protections et de survivre dans un monde ou les systemes informatiques ont pris une forme physique, hostile et quasi mystique.

Le coeur de l'experience repose sur trois sensations:

- avancer dans des environnements techno-oppressants avec un personnage agile, lisible et precis;
- entrer dans des combats tres stylises ou l'action du joueur reste importante meme pendant le tour ennemi;
- construire une equipe dont les attaques exploitent faiblesses, vulnerabilites et fenetres de rupture.

### 2.2 Piliers de design

1. Combat reactif: le joueur n'est pas passif pendant le tour adverse. Blocage, parade, esquive, contre et fenetres de timing doivent compter.
2. Lisibilite tactique: chaque ennemi expose un type, des resistances, des points de rupture et des patterns reconnaissables.
3. Animation expressive: Elior doit communiquer son etat par la pose, la vitesse, l'anticipation, la recuperation et les transitions.
4. Identite cyber-RPG: les competences, ennemis et statuts traduisent des notions comme virus, firewall, injection, scan, sandbox, root access et corruption systeme.
5. Compagnonnage utile: Mira et le robot ne sont pas decoratifs. Ils renforcent lecture, combat, exploration et narration.

## 3. Positionnement produit

### 3.1 Genre

- Action-RPG d'exploration avec combat tactique reactif au tour par tour.
- Camera troisieme personne en exploration.
- Affrontements scenarises en arene ou semi-arene.

### 3.2 Plateforme cible

- Web desktop en priorite.
- BabylonJS + JavaScript vanilla dans un premier temps.
- Viser Chrome, Edge, Firefox recents.

### 3.3 Perimetre MVP

Le MVP doit prouver:

- un deplacement 3D solide pour Elior;
- un robot compagnon qui suit proprement;
- un premier combat reactif complet;
- un premier allié jouable ou semi-jouable: Mira;
- un premier boss ou elite avec faiblesses exploitable;
- une boucle simple exploration -> rencontre -> combat -> recompense.

## 4. Boucle de jeu principale

1. Explorer une zone cyber-urbaine ou academique contamnee.
2. Observer l'environnement avec l'aide du robot compagnon.
3. Detecter un ennemi, une faille, un terminal ou un evenement narratif.
4. Entrer en combat.
5. Lire les faiblesses, preparer une rupture, temporiser, parer ou esquiver.
6. Exposer la cible a une vulnerabilite.
7. Declencher une competence majeure avec Elior ou Mira.
8. Recuperer ressources, donnees, fragments ou nouveaux modules.

## 5. Univers et direction narrative

### 5.1 Cadre general

Le monde est infecte par une couche numerique devenue visible et active. Les infrastructures sont transformees en lieux hostiles, les protocoles prennent la forme d'entites et les failles deviennent des opportunites de survie.

### 5.2 Ton

- melancolique;
- elegant et froid;
- technologique mais organique;
- dramatique sans tomber dans la parodie hacker.

### 5.3 Trame de base proposee

Cette trame est volontairement ouverte pour laisser de la place a un developpement ulterieur:

- Elior survit a une rupture de securite qui a ravage son secteur.
- Il est accompagne d'un robot tactique qui contient des fragments de logs sur l'origine du desastre.
- Mira rejoint progressivement l'equipe avec une approche plus analytique et plus risquee du cyber-combat.
- Les antagonistes sont des entites systemiques, des architectures corrompues et des intelligences defensives deviees.

## 6. Personnage principal - Elior

### 6.1 Role gameplay

Elior est le pivot offensif du jeu. Il ouvre les defenses, cree des fenetres de rupture et execute les gros bursts.

### 6.2 Identite combat

- style: combattant technique agressif;
- specialite: exploitation de failles et pression melee/mobile;
- faiblesse: engagement proche, demande du timing et de la lecture;
- ressource secondaire: Charge d'Exploit.

### 6.3 Ressources d'Elior

- PV: survie.
- PA: actions speciales.
- ATQ: degats physiques/techniques.
- DEF: mitigation.
- VIT: ordre de tour et fenetres de reaction.
- Charge d'Exploit: ressource propre a Elior, montee via attaques de base, parades parfaites et ciblage de failles.

### 6.4 Capacites fondatrices d'Elior

| Nom | Type | Cout | Fonction |
|---|---|---:|---|
| Ping Sweep | Reseau | 0 PA | Attaque basique, faibles degats, +1 Charge d'Exploit, rend 1 PA si timing parfait |
| Port Scan | Reseau | 1 PA | Revele les resistances/faiblesses, marque un point faible |
| SQL Injection | Web | 3 PA | Frappe lourde contre firewall, bases de donnees et noeuds verrouilles |
| Buffer Overflow | Systeme | 4 PA | Grosse frappe, chance d'etourdir ou de casser une garde |
| Kernel Patch | Systeme | 4 PA | Applique Vulnerable Systeme, baisse DEF et expose un point de rupture |
| Zero-Day | Exploit | 6 PA + 10 charges | Grosse execution, ignore une partie de la DEF |
| Counter Hack | Exploit | 0 PA reaction | Contre automatique apres parade parfaite |

## 7. Mouvements d'Elior en exploration

Le joueur doit sentir qu'Elior est precis, legerement lourd, et toujours pret a reagir. Les mouvements ne doivent pas etre arcade purs: il faut une inertie minimale, une anticipation visible et des recuperations courtes mais reelles.

### 7.1 Liste des mouvements obligatoires

1. Idle combat-ready.
2. Marche lente.
3. Course.
4. Sprint court.
5. Rotation sur place gauche/droite.
6. Start run.
7. Stop run.
8. Accroupi entree.
9. Accroupi idle.
10. Accroupi deplacement.
11. Sortie accroupi.
12. Saut preparation.
13. Saut impulsion.
14. Saut apex.
15. Chute.
16. Atterrissage leger.
17. Atterrissage lourd.
18. Esquive gauche.
19. Esquive droite.
20. Pas arriere defensif.
21. Blocage.
22. Parade.
23. Impact leger.
24. Impact lourd.
25. Knockdown.
26. Releve.
27. Attaque basique 1.
28. Attaque basique 2.
29. Attaque basique 3.
30. Attaque lourde/competence.
31. Attaque aerienne optionnelle.
32. Interaction terminal.

### 7.2 Intentions de sensation

- Idle: Elior n'est jamais completement relache. Son centre de gravite reste engage.
- Marche: utile pour la precision et l'observation.
- Course: animation principale d'exploration.
- Sprint: breve acceleration, pas un parkour permanent.
- Accroupi: lecture infiltration, prudence, scan de terrain.
- Esquive: decalage nerveux, court, tendu.
- Saut: anticipation visible avant l'impulsion.

## 8. Cahier d'animation d'Elior

### 8.1 Bloc locomotion principal

| Etat | Description | Duree cible | Notes |
|---|---|---:|---|
| Idle Ready | Posture neutre, respiration legere, poids en avant | boucle | Base de tout le systeme |
| Start Move | Passage de l'appui fixe vers la locomotion | 0.18-0.28 s | Tres important pour eviter une sensation glissante |
| Walk | Deplacement lent | boucle | Utilise pour zones de precision |
| Run | Deplacement standard | boucle | Etat principal |
| Sprint Burst | Acceleration plus agressive | 0.35 s puis boucle courte | Peut etre contextuel |
| Stop Move | Deceleration | 0.18-0.30 s | Joue selon la vitesse actuelle |
| Turn In Place Left/Right | Rotation sans translation | 0.20-0.45 s | Necessaire pour lisibilite a basse vitesse |

### 8.2 Bloc verticalite

| Etat | Description | Duree cible | Notes |
|---|---|---:|---|
| Jump Anticipation | Compression avant saut | 0.10-0.16 s | Transition cle, ne pas la supprimer |
| Jump Takeoff | Poussee au sol | 0.08-0.12 s | Peut recevoir root motion verticale symbolique |
| Jump Rise | Montee | variable | Bras et buste ouverts |
| Jump Apex | Point haut | 0.06-0.10 s | Tres courte pause de lecture |
| Fall Loop | Descente | variable | Peut differer si arme sortie |
| Land Soft | Reprise appui legere | 0.14-0.22 s | Si faible hauteur |
| Land Hard | Absorption genoux + bras | 0.22-0.40 s | Si vitesse verticale elevee |

### 8.3 Bloc accroupi

| Etat | Description | Duree cible | Notes |
|---|---|---:|---|
| Crouch Enter | Descente controlee | 0.16-0.24 s | Transition indispensable |
| Crouch Idle | Pause basse | boucle | Utilise pour infiltration |
| Crouch Move | Marche basse | boucle | Vitesse reduite |
| Crouch Exit | Remontee | 0.16-0.24 s | Peut etre coupee par esquive ou attaque |

### 8.4 Bloc defense et reactions

| Etat | Description | Duree cible | Notes |
|---|---|---:|---|
| Guard Raise | Lever de garde | 0.08-0.14 s | Entree blocage |
| Guard Hold | Blocage maintenu | boucle | Reduit degats |
| Perfect Parry | Deflection precise | 0.18-0.26 s | Fenetre stricte, feedback fort |
| Dodge Left | Esquive laterale gauche | 0.22-0.34 s | Invulnerabilite partielle |
| Dodge Right | Esquive laterale droite | 0.22-0.34 s | Symetrique |
| Backstep | Recul defensif | 0.18-0.28 s | Alternative sobre |
| Hit Light | Petit impact | 0.20-0.32 s | Ne coupe pas toujours l'action |
| Hit Heavy | Gros impact | 0.35-0.55 s | Ouvre une punition |
| Knockdown | Projection/chute | variable | Etat critique |
| Get Up | Releve | 0.80-1.20 s | Vulnerable au demarrage |

### 8.5 Bloc attaques

| Etat | Description | Duree cible | Notes |
|---|---|---:|---|
| Attack 1 | Coup d'ouverture rapide | 0.35-0.45 s | Faible engagement |
| Attack 2 | Continuation | 0.38-0.50 s | Angle different |
| Attack 3 | Finisher leger | 0.45-0.65 s | Repousse ou marque rupture |
| Heavy Skill Start | Preparation de competence | 0.20-0.40 s | Anticipation forte |
| Heavy Skill Release | Impact principal | variable | Cam shake, VFX, son |
| Recovery | Reprise apres frappe | 0.12-0.30 s | Annulable seulement dans certains cas |
| Counter Attack | Replique apres parade | 0.25-0.40 s | Tres lisible et satisfaisante |

## 9. Transitions d'animation obligatoires

Cette section est critique. Le personnage ne doit jamais sauter brutalement d'une pose a une autre sans logique visuelle.

### 9.1 Transitions locomotion

- Idle -> Start Move -> Walk/Run.
- Run -> Stop Move -> Idle.
- Walk -> Run via blend vitesse.
- Run -> Turn Running si angle faible, sinon Stop Move -> Turn In Place -> Start Move.

### 9.2 Transitions saut

- Idle/Walk/Run -> Jump Anticipation -> Jump Takeoff -> Jump Rise.
- Jump Rise -> Jump Apex -> Fall Loop.
- Fall Loop -> Land Soft ou Land Hard selon vitesse verticale.
- Land Soft -> Idle ou Run selon input.
- Land Hard -> Recovery court -> Idle/Run.

### 9.3 Transitions accroupi

- Idle/Walk -> Crouch Enter -> Crouch Idle/Crouch Move.
- Crouch Move -> Crouch Idle si vitesse nulle.
- Crouch Idle/Crouch Move -> Crouch Exit -> Idle/Walk.
- Crouch state -> Dodge autorise si systeme le permet.

### 9.4 Transitions combat et defense

- Idle/Run -> Guard Raise -> Guard Hold.
- Guard Hold -> Perfect Parry si input dans la fenetre.
- Guard Hold -> Dodge Left/Right.
- Guard Hold -> Idle via release court.
- Hit Light -> Guard Hold si blocage maintenu.
- Perfect Parry -> Counter Attack ou retour neutre.

### 9.5 Transitions attaques

- Idle/Run -> Attack 1.
- Attack 1 -> Attack 2 si input en fenetre combo.
- Attack 2 -> Attack 3 si input en fenetre combo.
- Attack 1/2/3 -> Recovery -> Idle/Run.
- Attack recovery -> Dodge seulement sur certaines attaques pour garder un vrai engagement.
- Heavy Skill Start -> Heavy Skill Release -> Recovery.

## 10. Machine d'etats recommandee pour Elior

### 10.1 Etats haut niveau

- Exploration.
- Combat.
- Reaction.
- Interaction.
- Cinematique.

### 10.2 Sous-etats d'exploration

- idle
- walk
- run
- sprint
- crouch_idle
- crouch_move
- jump_start
- jump_air
- fall
- land
- dodge_left
- dodge_right
- interact

### 10.3 Sous-etats de combat

- combat_idle
- guard
- parry
- attack_light_1
- attack_light_2
- attack_light_3
- skill_cast
- counter
- hit_light
- hit_heavy
- down
- get_up

### 10.4 Regles de priorite

1. Mort/knockdown prioritaire sur tout.
2. Hit heavy prioritaire sur locomotion et attaques legeres.
3. Parry prioritaire sur guard hold si fenetre valide.
4. Dodge interrompt locomotion et certains recovery autorises.
5. Interaction bloquee si menace proche ou combat actif.

## 11. Robot compagnon

### 11.1 Positionnement

Le robot compagnon sert a la fois de guide, d'outil de lecture et de support tactique. Pour rester coherent avec le repo existant, il peut reprendre le nom BYTE, tout en restant renommable plus tard.

### 11.2 Roles

- suivi du joueur en exploration;
- ping visuel sur objectifs, terminaux, failles et menaces;
- assistance de combat par scan, marquage, ralentissement ou generation de ressource;
- exposition narrative via logs, commentaires contextuels et diagnostics.

### 11.3 Comportement de suivi

| Comportement | Regle |
|---|---|
| Distance standard | 1.5 m a 2.5 m derriere ou sur le cote d'Elior |
| Repositionnement | si obstacle ou eloignement > 6 m |
| Teleport discret | si distance > 12 m ou chute hors navmesh |
| Hauteur relative | flottement stable a environ 1.8 m |
| Mode observation | orbite lente quand Elior est a l'arret |
| Mode alerte | se place plus haut et plus proche du champ visuel |

### 11.4 Etats du robot

- follow;
- hover_idle;
- inspect;
- alert;
- scan;
- combat_support;
- cinematic_anchor.

### 11.5 Capacites du robot

| Nom | Effet |
|---|---|
| Threat Scan | Revele type, resistances et pattern d'un ennemi |
| Weakpoint Ping | Marque un point faible, augmente precision des attaques ciblees |
| Packet Shield | Petit bouclier temporaire sur Elior ou Mira |
| Signal Relay | Rend 1 PA a un allie |
| Trace Pulse | Detecte objets interactifs et logs caches |

## 12. Mira - alliee cle

### 12.1 Role gameplay

Mira est une operatrice analytique. Elle manipule les flux, les statuts, les debuffs et les conversions d'avantage tactique.

### 12.2 Identite

- style: mage techno-analytique;
- specialite: controle, disruption, amplification de vulnerabilites;
- ressource secondaire: Tokens ou Fragments de Calcul.

### 12.3 Capacites proposees pour Mira

| Nom | Type | Cout | Effet |
|---|---|---:|---|
| Hash Burst | Crypto | 2 PA | Degats techniques, genere 1 Token |
| Salt Shield | Defensif | 2 PA + 1 Token | Bouclier et resistance temporaire |
| Man in the Middle | Reseau | 3 PA + 1 Token | Vole 1 PA ou retarde l'action ennemie |
| Deep Scan | Analyse | 2 PA | Revele faiblesses cachees et patterns de phase |
| Sandbox Isolation | Systeme | 4 PA | Enferme une cible, baisse VIT et puissance |
| RSA Crack | Crypto | 4 PA + 2 Tokens | Grosse attaque sur cibles chiffrees ou blindees |
| Prompt Poisoning | IA | 5 PA | Affaiblit une IA, brouille ses priorites et ouvre une faille |

### 12.4 Synergies Mira x Elior

- Mira revele ou cree des vulnerabilites.
- Elior exploite ces ouvertures avec des attaques a haut impact.
- Le robot maintient la lecture tactique et le support de ressources.

## 13. Systeme de combat cible

### 13.1 Structure d'un tour

Pendant le tour joueur:

- attaque basique;
- attaque ciblee/exploit cible;
- competence;
- objet;
- commande de support du robot si disponible.

Pendant le tour ennemi:

- blocage;
- parade;
- esquive reseau si type compatible;
- reaction QTE ou timing bonus selon le pattern adverse.

### 13.2 Formule simple de degats

$$
Degats = Puissance \times \frac{ATQ}{DEF_{cible}} \times Multiplicateur
$$

Multiplicateur:

- faiblesse: x1.3
- super faiblesse specifique: x1.5
- resistance: x0.7
- cible en rupture: x1.25 a x1.50 supplementaire selon equilibrage

### 13.3 Etats de statut recommandes

- Corruption: degats sur la duree.
- Latence: baisse VIT.
- Vulnerable Systeme: baisse DEF.
- Blindage Chiffre: reduit les degats entrants.
- Expose: augmente les chances de coup critique ou de rupture.
- Silence de Bus: empeche certaines competences.
- Infection: debuff cumulatif.

### 13.4 Rupture / Break

Chaque ennemi important dispose d'une jauge de stabilite ou d'integrite.

- certaines attaques d'Elior et Mira remplissent la jauge de rupture;
- certaines faiblesses accelerent cette rupture;
- une cible brisee subit stun court, DEF reduite et degats augmentes;
- c'est la fenetre principale de burst et de mise en scene.

## 14. Archetypes d'ennemis

### 14.1 Firewall basique

- types: Reseau / Systeme
- faible a: Web Injection, SQL Injection, XSS-like attacks
- resistant a: Brute Force
- comportement: bloque, ralentit, purge des buffs

### 14.2 Malware Trojan

- types: Systeme / IA
- faible a: Scan Antivirus, Sandbox Isolation
- comportement: infection, vol de PA, corruption dans la duree

### 14.3 Rootkit Alpha

- type boss: Systeme / Stealth
- point faible majeur: Kernel Patch
- pattern: buffs, invisibilite partielle, grosse execution mono-cible, AoE systemique
- phase 2: plus rapide, plus agressif, plus punitif sur les erreurs de timing

## 15. Specification technique BabylonJS

### 15.1 Architecture recommandee

- `player-controller.js`: deplacement, collisions, lecture input, camera, FSM du joueur.
- `animation-controller.js`: etats, blend trees, transitions, callbacks d'impact.
- `combat-system.js`: logique de tour, reactions, parry windows, jauges.
- `companion-system.js`: robot, suivi, scan, support.
- `ally-mira-system.js`: logique de Mira, IA alliee ou commandes joueur.
- `enemy-system.js`: comportements, faiblesses, phases et telegraphes.
- `data/skills/*.json`: competences, couts, types, timings, VFX hooks.

### 15.2 Controleur joueur

Le controleur d'Elior doit gerer:

- vitesse cible et acceleration;
- inertie au sol;
- saut avec coyote time simple si necessaire;
- detection du sol;
- lock orientation vers direction de deplacement hors combat;
- lock orientation vers cible en combat;
- priorites d'etat pour eviter les conflits animation/gameplay.

### 15.3 Animation system

Choix recommandes:

- utiliser un Animation Group par etat principal si import GLB;
- centraliser transitions dans une machine d'etat claire;
- definir des tags de frames ou callbacks pour impact, invulnerabilite, ouverture combo, fin de recovery;
- utiliser root motion uniquement si elle est vraiment maitrisee; sinon garder une locomotion pilotee par code et des animations in-place.

### 15.4 Camera

- exploration: troisieme personne lisible, angle bas modere, legere inertia;
- combat: camera plus composee, recadrage automatique sur cibles et duo Elior/Mira;
- esquive/parade: micro shake et accent timing;
- break finisher: camera temporaire plus dramatique.

## 16. Exigences d'animation pour la production 3D

### 16.1 Elior - set minimum pour un prototype jouable

- idle_ready
- walk_forward
- run_forward
- start_run
- stop_run
- turn_left_in_place
- turn_right_in_place
- crouch_enter
- crouch_idle
- crouch_move
- crouch_exit
- jump_anticipation
- jump_takeoff
- jump_rise
- fall_loop
- land_soft
- land_hard
- dodge_left
- dodge_right
- guard_raise
- guard_hold
- parry
- hit_light
- hit_heavy
- knockdown
- get_up
- attack_light_1
- attack_light_2
- attack_light_3
- skill_heavy
- counter_attack
- interact_terminal

### 16.2 Robot - set minimum

- hover_idle
- follow_fast
- orbit_idle
- alert_expand
- scan_pulse
- support_cast
- damage_react

### 16.3 Mira - set minimum

- idle_analyst
- run_light
- cast_short
- cast_long
- dodge_back
- hit_light
- support_release
- ultimate_cast

## 17. UX et lisibilite combat

Le joueur doit comprendre immediatement:

- qui agit;
- quelle attaque arrive;
- quelle reaction est disponible;
- si la parade est parfaite, bonne ou ratee;
- quand un point faible est revele;
- quand une cible entre en rupture.

Elements visuels obligatoires:

- telegraphes d'attaque;
- code couleur par type;
- feedback sonore et VFX differencies pour block, parry, dodge;
- marquage des points faibles;
- log de combat concis.

## 18. Roadmap de production suggeree

### Phase 1 - Vertical slice technique

- Elior jouable avec locomotion complete.
- Robot compagnon fonctionnel.
- Une arene et un ennemi elite.
- Mira en support simple.
- Combat reactif avec blocage, parade, esquive.

### Phase 2 - Vertical slice contenu

- Une zone narrative courte.
- Un mini-arc Elior + Mira + robot.
- Un boss Rootkit Alpha ou equivalent.
- Une boucle progression lisible.

### Phase 3 - Production etendue

- roster d'ennemis;
- variations de zones;
- boss multiphases;
- approfondissement narratif;
- polish VFX/SFX/camera.

## 19. Priorites de developpement

Ordre conseille:

1. Controle et feeling d'Elior.
2. Machine d'etats animation + transitions.
3. Robot compagnon et suivi propre.
4. Combat reactif minimal.
5. Mira et synergies.
6. Premier boss et premier vrai niveau.
7. Narration detaillee.

## 20. Definition de reussite

Le prototype est considere reussi si:

- Elior est agreable a deplacer pendant 10 minutes sans frustration;
- les transitions saut, accroupi, esquive et attaques paraissent naturelles;
- le robot suit sans casser la mise en scene ni se perdre;
- Mira apporte une vraie couche tactique;
- le combat donne une sensation de tension, de rythme et de lecture claire;
- la base technique est assez saine pour produire ensuite l'histoire, les quetes et les zones.

## 21. Notes finales

Les noms, personnages et competences proposes ici sont modulables. L'important est de verrouiller d'abord:

- la sensation d'Elior;
- la lisibilite des animations;
- la boucle de combat reactive;
- les synergies Elior / Mira / robot;
- la structure technique BabylonJS.

L'histoire complete pourra ensuite se construire proprement sur une base de gameplay deja convaincante.
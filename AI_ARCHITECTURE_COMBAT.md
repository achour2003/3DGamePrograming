# Architecture IA de Combat — Cyber-RPG BabylonJS

## 1. Vue d'ensemble

Ce document definit l'architecture technique du systeme d'intelligence artificielle
de combat. L'objectif est un moteur unique, data-driven, capable de piloter tout
type d'ennemi grace a un pipeline en trois couches:

1. Generateur de contraintes: filtre les actions legales.
2. Evaluateur tactique: attribue un score a chaque action ou sequence d'actions.
3. Controleur de personnalite: choisit parmi les meilleures actions avec un profil
   probabiliste qui depend du niveau de difficulte et de la phase.

Le systeme doit aussi gerer les combinaisons d'actions quand un ennemi dispose de
suffisamment de PA pour executer plusieurs capacites dans un meme tour.

## 2. Principes fondateurs

### 2.1 IA commune, donnees specifiques

Il n'y a qu'un seul moteur de decision. Les differences entre un Firewall basique
et un boss Rootkit Alpha viennent exclusivement de leurs donnees:

- capacites disponibles;
- stats;
- profil de personnalite;
- regles de phase.

Le code IA ne contient aucune logique codee en dur pour un monstre specifique.

### 2.2 Separation evaluation / selection

L'evaluateur produit un classement honnete des meilleures options.
Le controleur de personnalite introduit volontairement de l'imperfection pour
que l'IA soit jouable et non omnisciente.

### 2.3 Profondeur combinatoire

L'IA raisonne en sequences d'actions par tour, pas en actions isolees.
Si un ennemi a 4 PA, le moteur evalue les plans comme:

- BufferOverflow (4 PA) seul;
- BlockPort (1 PA) + RateLimit (2 PA) + defend residuel;
- RateLimit (2 PA) x 2;
- etc.

C'est la dimension qui manquait a l'ancien systeme de scoring lineaire.

## 3. Analyse de l'ancien systeme et justification du nouveau

### 3.1 Ce qui fonctionnait dans l'ancien systeme

L'ancien moteur (AI_TECHNICAL_GUIDE.md) utilisait un scoring lineaire multi-factoriel
avec tri et selection du meilleur score. C'etait un bon point de depart:

- simple a implementer;
- rapide a calculer;
- suffisant pour des ennemis basiques a 1 action par tour.

### 3.2 Limites identifiees

| Aspect | Ancien systeme | Probleme |
|---|---|---|
| Raisonnement | 1 action a la fois | Pas de combos, pas de plans tactiques |
| Combos | Aucun | Un ennemi avec 3 PA gaspille du potentiel |
| Difficulte | Variance aleatoire | Pas de personnalite, pas de courbe maitrisee |
| Prediction joueur | Aucune ou basique | L'IA ne s'adapte pas au style du joueur |
| Break awareness | Non | L'IA ne sait pas proteger sa jauge de rupture |
| Phase boss | Flag bool | Pas de transitions riches entre phases |
| Extensibilite | Code specifique par boss | Chaque boss demande du code custom |
| Reactions joueur | Ignorees | L'IA ne sait pas varier face a un joueur qui parry tout |

### 3.3 Pourquoi trois couches

La separation en trois couches resout ces limites:

- Couche contraintes: empeche les actions illegales et genere des plans multi-actions.
- Couche evaluateur: score les plans complets avec prise en compte des synergies.
- Couche controleur: permet a chaque ennemi d'avoir une "qualite de jeu" differente
  sans modifier le code.

## 4. Modelisation objet

### 4.1 Classe Entity

Classe de base partagee entre joueurs et ennemis.

```javascript
class Entity {
  constructor(config) {
    this.id            = config.id;
    this.name          = config.name;
    this.maxHp         = config.maxHp;
    this.hp            = config.maxHp;
    this.maxPa         = config.maxPa;
    this.pa            = config.maxPa;
    this.atq           = config.atq;
    this.def           = config.def;
    this.vit           = config.vit;
    this.types         = config.types;       // ["Reseau", "Systeme"]
    this.weaknesses    = config.weaknesses;  // { "Web_Injection": 1.3, "SQLInjection": 1.5 }
    this.resistances   = config.resistances; // { "BruteForce": 0.7 }
    this.skills        = [];                 // liste de Skill instancies
    this.statusEffects = [];
    this.breakGauge    = 0;
    this.maxBreak      = config.maxBreak || 100;
    this.lastPlan      = null;               // pour penalite de repetition
  }

  isAlive()    { return this.hp > 0; }
  isBroken()   { return this.breakGauge >= this.maxBreak; }

  getEffDef() {
    let modifier = 1.0;
    for (const s of this.statusEffects) {
      if (s.type === 'vulnerable_systeme') modifier *= (1 - s.defReduction);
      if (s.type === 'def_down')           modifier *= Math.max(0.2, 1 + s.value / this.def);
      if (s.type === 'def_up')             modifier *= (1 + s.value / this.def);
    }
    return this.def * modifier;
  }

  getWeaknessMultiplier(attackType, attackName) {
    if (this.weaknesses[attackName])  return this.weaknesses[attackName];
    if (this.weaknesses[attackType])  return this.weaknesses[attackType];
    if (this.resistances[attackType]) return this.resistances[attackType];
    if (this.resistances[attackName]) return this.resistances[attackName];
    return 1.0;
  }

  applyDamage(amount) {
    this.hp = Math.max(0, this.hp - Math.round(amount));
  }

  applyBreak(amount) {
    this.breakGauge = Math.min(this.maxBreak, this.breakGauge + amount);
  }

  tickStatusEffects() {
    for (const s of this.statusEffects) {
      if (s.type === 'corruption') this.applyDamage(s.value);
      s.duration--;
    }
    this.statusEffects = this.statusEffects.filter(s => s.duration > 0);
  }
}
```

### 4.2 Classe Skill

```javascript
class Skill {
  constructor(data) {
    this.id          = data.id;
    this.name        = data.name;
    this.type        = data.type;        // "Reseau", "Web", "Systeme", "Crypto", "IA"
    this.paCost      = data.paCost;
    this.power       = data.power;
    this.cooldown    = data.cooldown || 0;
    this.currentCd   = 0;
    this.target      = data.target;      // "single", "aoe", "self"
    this.effects     = data.effects;     // [{ type: "stun", chance: 0.3, duration: 1 }]
    this.breakDamage = data.breakDamage || 0;
    this.tags        = data.tags || [];
    this.comboTags   = data.comboTags || [];
    this.reactable   = data.reactable || null;
  }

  isUsable(caster) {
    return caster.pa >= this.paCost
        && this.currentCd === 0;
  }

  tickCooldown() {
    if (this.currentCd > 0) this.currentCd--;
  }
}
```

### 4.3 Chargement depuis JSON

```javascript
class EnemyFactory {
  static fromJSON(json) {
    const entity    = new Entity(json.stats);
    entity.skills   = json.skills.map(s => new Skill(s));
    entity.aiProfile = json.aiProfile;
    entity.phases    = json.phases || [];
    return entity;
  }

  static loadFromFile(url) {
    return fetch(url)
      .then(r => r.json())
      .then(json => EnemyFactory.fromJSON(json));
  }
}
```

## 5. Format de donnees JSON

### 5.1 Monstre normal — Firewall basique

```json
{
  "id": "firewall_basic",
  "stats": {
    "id": "firewall_basic",
    "name": "Firewall Basique",
    "maxHp": 300,
    "maxPa": 3,
    "atq": 20,
    "def": 25,
    "vit": 12,
    "types": ["Reseau", "Systeme"],
    "weaknesses": {
      "Web_Injection": 1.3,
      "SQLInjection": 1.5
    },
    "resistances": {
      "BruteForce": 0.7
    },
    "maxBreak": 80
  },
  "skills": [
    {
      "id": "block_port",
      "name": "Block Port",
      "type": "Reseau",
      "paCost": 1,
      "power": 15,
      "target": "single",
      "effects": [{ "type": "latence", "value": -3, "duration": 2 }],
      "breakDamage": 0,
      "comboTags": ["opener", "control"],
      "reactable": {
        "blockable": true,
        "parryable": true,
        "dodgeable": true,
        "parryWindow": 0.35,
        "telegraphDuration": 1.0
      }
    },
    {
      "id": "rate_limit",
      "name": "Rate Limit",
      "type": "Systeme",
      "paCost": 2,
      "power": 25,
      "target": "single",
      "effects": [{ "type": "pa_regen_down", "value": -1, "duration": 1 }],
      "breakDamage": 0,
      "comboTags": ["follow_up", "pressure"],
      "reactable": {
        "blockable": true,
        "parryable": true,
        "dodgeable": false,
        "parryWindow": 0.30,
        "telegraphDuration": 0.8
      }
    },
    {
      "id": "deep_packet_inspect",
      "name": "Deep Packet Inspection",
      "type": "Reseau",
      "paCost": 2,
      "power": 22,
      "target": "single",
      "effects": [{ "type": "purge_buff", "chance": 0.5 }],
      "breakDamage": 5,
      "comboTags": ["follow_up", "strip"],
      "reactable": {
        "blockable": true,
        "parryable": false,
        "dodgeable": true,
        "parryWindow": 0,
        "telegraphDuration": 1.2
      }
    }
  ],
  "aiProfile": {
    "difficultyLevel": 1,
    "aggressiveness": 0.5,
    "selectionWeights": [0.25, 0.45, 0.20, 0.10],
    "comboAwareness": 0.3,
    "predictionDepth": 0
  },
  "phases": []
}
```

### 5.2 Monstre normal — Malware Trojan

```json
{
  "id": "malware_trojan",
  "stats": {
    "id": "malware_trojan",
    "name": "Malware Trojan",
    "maxHp": 250,
    "maxPa": 3,
    "atq": 18,
    "def": 15,
    "vit": 16,
    "types": ["Systeme", "IA"],
    "weaknesses": {
      "ScanAntivirus": 1.3,
      "SandboxIsolation": 1.3
    },
    "resistances": {
      "Crypto": 0.8
    },
    "maxBreak": 60
  },
  "skills": [
    {
      "id": "infect_file",
      "name": "Infect File",
      "type": "Systeme",
      "paCost": 1,
      "power": 8,
      "target": "single",
      "effects": [{ "type": "corruption", "value": 12, "duration": 3 }],
      "breakDamage": 0,
      "comboTags": ["opener", "dot"],
      "reactable": {
        "blockable": true,
        "parryable": true,
        "dodgeable": true,
        "parryWindow": 0.30,
        "telegraphDuration": 0.9
      }
    },
    {
      "id": "keylogger",
      "name": "Keylogger",
      "type": "IA",
      "paCost": 2,
      "power": 10,
      "target": "single",
      "effects": [{ "type": "steal_pa", "value": 1 }],
      "breakDamage": 0,
      "comboTags": ["follow_up", "control"],
      "reactable": {
        "blockable": false,
        "parryable": true,
        "dodgeable": true,
        "parryWindow": 0.20,
        "telegraphDuration": 0.6
      }
    },
    {
      "id": "polymorphic_shell",
      "name": "Polymorphic Shell",
      "type": "Systeme",
      "paCost": 2,
      "power": 0,
      "target": "self",
      "effects": [
        { "type": "def_up", "value": 8, "duration": 2 },
        { "type": "evasion_up", "value": 0.2, "duration": 2 }
      ],
      "breakDamage": 0,
      "comboTags": ["opener", "buff"],
      "reactable": null
    }
  ],
  "aiProfile": {
    "difficultyLevel": 1,
    "aggressiveness": 0.6,
    "selectionWeights": [0.25, 0.45, 0.20, 0.10],
    "comboAwareness": 0.4,
    "predictionDepth": 0
  },
  "phases": []
}
```

### 5.3 Boss multi-phases — Rootkit Alpha

```json
{
  "id": "rootkit_alpha",
  "stats": {
    "id": "rootkit_alpha",
    "name": "Rootkit Alpha",
    "maxHp": 2000,
    "maxPa": 5,
    "atq": 40,
    "def": 30,
    "vit": 8,
    "types": ["Systeme", "Stealth"],
    "weaknesses": {
      "KernelPatch": 1.5,
      "DeepScan": 1.3,
      "SandboxIsolation": 1.3
    },
    "resistances": {
      "BruteForce": 0.5,
      "Reseau": 0.8
    },
    "maxBreak": 150
  },
  "skills": [
    {
      "id": "hide_process",
      "name": "Hide Process",
      "type": "Stealth",
      "paCost": 2,
      "power": 0,
      "target": "self",
      "effects": [
        { "type": "def_up", "value": 15, "duration": 2 },
        { "type": "evasion_up", "value": 0.3, "duration": 2 }
      ],
      "breakDamage": 0,
      "comboTags": ["opener", "buff"],
      "reactable": null
    },
    {
      "id": "privilege_escalation",
      "name": "Privilege Escalation",
      "type": "Systeme",
      "paCost": 3,
      "power": 55,
      "target": "single",
      "effects": [{ "type": "def_pierce", "value": 0.3 }],
      "breakDamage": 0,
      "comboTags": ["finisher", "execute"],
      "reactable": {
        "blockable": true,
        "parryable": true,
        "dodgeable": false,
        "parryWindow": 0.25,
        "telegraphDuration": 1.2
      }
    },
    {
      "id": "root_access",
      "name": "Root Access",
      "type": "Systeme",
      "paCost": 4,
      "power": 30,
      "target": "aoe",
      "effects": [{ "type": "def_down", "value": -8, "duration": 2 }],
      "breakDamage": 10,
      "comboTags": ["pressure", "aoe"],
      "reactable": {
        "blockable": true,
        "parryable": false,
        "dodgeable": false,
        "parryWindow": 0,
        "telegraphDuration": 1.8
      }
    },
    {
      "id": "system_corruption",
      "name": "System Corruption",
      "type": "Systeme",
      "paCost": 2,
      "power": 12,
      "target": "single",
      "effects": [{ "type": "corruption", "value": 15, "duration": 4 }],
      "breakDamage": 0,
      "comboTags": ["opener", "dot"],
      "reactable": {
        "blockable": true,
        "parryable": true,
        "dodgeable": true,
        "parryWindow": 0.30,
        "telegraphDuration": 0.7
      }
    }
  ],
  "aiProfile": {
    "difficultyLevel": 3,
    "aggressiveness": 0.7,
    "selectionWeights": [0.50, 0.35, 0.10, 0.05],
    "comboAwareness": 0.8,
    "predictionDepth": 2
  },
  "phases": [
    {
      "trigger": { "hpBelow": 0.5 },
      "changes": {
        "vit": 14,
        "aggressiveness": 0.9,
        "selectionWeights": [0.65, 0.25, 0.07, 0.03],
        "comboAwareness": 1.0,
        "preferSkills": ["privilege_escalation", "root_access"]
      }
    }
  ]
}
```

### 5.4 Capacites joueur — Elior

```json
{
  "id": "elior",
  "stats": {
    "id": "elior",
    "name": "Elior",
    "maxHp": 450,
    "maxPa": 6,
    "atq": 28,
    "def": 18,
    "vit": 15,
    "types": ["Operateur"],
    "weaknesses": {},
    "resistances": {},
    "maxBreak": 999
  },
  "skills": [
    {
      "id": "ping_sweep",
      "name": "Ping Sweep",
      "type": "Reseau",
      "paCost": 0,
      "power": 12,
      "target": "single",
      "effects": [{ "type": "exploit_charge", "value": 1 }],
      "breakDamage": 5,
      "comboTags": ["opener", "builder"],
      "perfectTimingBonus": { "type": "pa_regen", "value": 1 }
    },
    {
      "id": "port_scan",
      "name": "Port Scan",
      "type": "Reseau",
      "paCost": 1,
      "power": 8,
      "target": "single",
      "effects": [{ "type": "reveal_weakness", "duration": 99 }],
      "breakDamage": 0,
      "comboTags": ["opener", "scan"]
    },
    {
      "id": "sql_injection",
      "name": "SQL Injection",
      "type": "Web",
      "paCost": 3,
      "power": 45,
      "target": "single",
      "effects": [],
      "breakDamage": 25,
      "comboTags": ["finisher", "exploit"]
    },
    {
      "id": "buffer_overflow",
      "name": "Buffer Overflow",
      "type": "Systeme",
      "paCost": 4,
      "power": 50,
      "target": "single",
      "effects": [{ "type": "stun", "chance": 0.35, "duration": 1 }],
      "breakDamage": 20,
      "comboTags": ["finisher", "burst"]
    },
    {
      "id": "kernel_patch",
      "name": "Kernel Patch",
      "type": "Systeme",
      "paCost": 4,
      "power": 20,
      "target": "single",
      "effects": [{ "type": "vulnerable_systeme", "duration": 2, "defReduction": 0.5 }],
      "breakDamage": 40,
      "comboTags": ["opener", "break"]
    },
    {
      "id": "zero_day",
      "name": "Zero-Day",
      "type": "Exploit",
      "paCost": 6,
      "power": 80,
      "target": "single",
      "effects": [{ "type": "def_pierce", "value": 0.5 }],
      "requiresCharges": 10,
      "breakDamage": 50,
      "comboTags": ["finisher", "ultimate"]
    },
    {
      "id": "counter_hack",
      "name": "Counter Hack",
      "type": "Exploit",
      "paCost": 0,
      "power": 25,
      "target": "single",
      "effects": [],
      "breakDamage": 10,
      "comboTags": ["counter"],
      "triggerCondition": "perfect_parry"
    }
  ]
}
```

### 5.5 Capacites joueur — Mira

```json
{
  "id": "mira",
  "stats": {
    "id": "mira",
    "name": "Mira",
    "maxHp": 350,
    "maxPa": 5,
    "atq": 22,
    "def": 14,
    "vit": 18,
    "types": ["Analyste"],
    "weaknesses": {},
    "resistances": {},
    "maxBreak": 999
  },
  "skills": [
    {
      "id": "hash_burst",
      "name": "Hash Burst",
      "type": "Crypto",
      "paCost": 2,
      "power": 30,
      "target": "single",
      "effects": [{ "type": "generate_token", "value": 1 }],
      "breakDamage": 10,
      "comboTags": ["opener", "builder"]
    },
    {
      "id": "salt_shield",
      "name": "Salt Shield",
      "type": "Defensif",
      "paCost": 2,
      "power": 0,
      "target": "single_ally",
      "effects": [{ "type": "def_up", "value": 12, "duration": 2 }],
      "requiresTokens": 1,
      "breakDamage": 0,
      "comboTags": ["support", "buff"]
    },
    {
      "id": "man_in_the_middle",
      "name": "Man in the Middle",
      "type": "Reseau",
      "paCost": 3,
      "power": 15,
      "target": "single",
      "effects": [{ "type": "steal_pa", "value": 1 }],
      "requiresTokens": 1,
      "breakDamage": 5,
      "comboTags": ["follow_up", "control"]
    },
    {
      "id": "deep_scan",
      "name": "Deep Scan",
      "type": "Analyse",
      "paCost": 2,
      "power": 0,
      "target": "single",
      "effects": [
        { "type": "reveal_weakness", "duration": 99 },
        { "type": "reveal_phase_pattern", "duration": 99 }
      ],
      "breakDamage": 0,
      "comboTags": ["opener", "scan"]
    },
    {
      "id": "sandbox_isolation",
      "name": "Sandbox Isolation",
      "type": "Systeme",
      "paCost": 4,
      "power": 10,
      "target": "single",
      "effects": [
        { "type": "latence", "value": -5, "duration": 2 },
        { "type": "atq_down", "value": -10, "duration": 2 }
      ],
      "breakDamage": 15,
      "comboTags": ["control", "pressure"]
    },
    {
      "id": "rsa_crack",
      "name": "RSA Crack",
      "type": "Crypto",
      "paCost": 4,
      "power": 60,
      "target": "single",
      "effects": [],
      "requiresTokens": 2,
      "breakDamage": 20,
      "comboTags": ["finisher", "burst"]
    },
    {
      "id": "prompt_poisoning",
      "name": "Prompt Poisoning",
      "type": "IA",
      "paCost": 5,
      "power": 25,
      "target": "single",
      "effects": [
        { "type": "confuse", "duration": 2 },
        { "type": "expose", "duration": 2 }
      ],
      "breakDamage": 30,
      "comboTags": ["opener", "break"]
    }
  ]
}
```

## 6. Pipeline de decision IA

### 6.1 Schema general

```
TOUR DE L'ENNEMI (PA disponibles = N)
        |
        v
+---------------------------+
| COUCHE 1: CONTRAINTES     |  Programmation par contraintes
| Genere les plans legaux   |  Filtre sur PA, cooldowns, HP,
| (actions seules + combos) |  pre-requis, statuts actifs
+---------------------------+
        |
        v  [liste de plans valides]
+---------------------------+
| COUCHE 2: EVALUATEUR      |  Modele heuristique + probabiliste
| Score chaque plan         |  Scoring multi-factoriel
| selon utilite tactique    |  Prediction joueur optionnelle
+---------------------------+
        |
        v  [plans tries par score]
+---------------------------+
| COUCHE 3: CONTROLEUR      |  IA symbolique / personnalite
| Choisit un plan selon     |  Selection ponderee par
| le profil de difficulte   |  difficulte et phase
+---------------------------+
        |
        v
    Plan retenu -> execution sequentielle des actions
```

### 6.2 Couche 1 — Generateur de contraintes

Cette couche enumere tous les plans d'actions realisables pour un budget de PA donne.
C'est un probleme de sac a dos contraint resolu par backtracking avec elagage.

```javascript
class ActionPlanner {

  /**
   * Genere tous les plans legaux pour un budget PA donne.
   * Un plan = liste ordonnee de skills a executer ce tour.
   */
  generatePlans(entity, allies, enemies, maxDepth = 3) {
    const usableSkills = entity.skills.filter(s => s.isUsable(entity));
    const plans = [];

    // Defend est toujours disponible, termine le tour
    plans.push([{ action: 'defend' }]);

    // Enumerer via backtracking les combinaisons legales
    this._enumerate(entity, usableSkills, enemies, allies,
                    entity.pa, [], plans, maxDepth);

    return plans;
  }

  _enumerate(entity, skills, enemies, allies, remainingPa,
             currentPlan, allPlans, depth) {

    // Plan courant non vide = plan valide (on peut s'arreter a tout moment)
    if (currentPlan.length > 0) {
      allPlans.push([...currentPlan]);
    }

    // Conditions d'arret
    if (depth <= 0 || remainingPa <= 0) return;
    if (allPlans.length >= 500) return; // garde-fou combinatoire

    for (const skill of skills) {
      if (skill.paCost > remainingPa) continue;
      if (this._violatesConstraints(skill, currentPlan, entity)) continue;

      const targets = this._getValidTargets(skill, enemies, allies, entity);
      for (const target of targets) {
        currentPlan.push({ skill, target });
        this._enumerate(entity, skills, enemies, allies,
                        remainingPa - skill.paCost,
                        currentPlan, allPlans, depth - 1);
        currentPlan.pop();
      }
    }
  }

  _violatesConstraints(skill, currentPlan, entity) {
    // Un meme buff self ne s'applique pas deux fois par tour
    if (skill.target === 'self' &&
        currentPlan.some(a => a.skill.id === skill.id)) return true;

    // Cooldown actif
    if (skill.currentCd > 0) return true;

    // Pre-requis specifiques
    if (skill.requiresCharges &&
        entity.exploitCharges < skill.requiresCharges) return true;
    if (skill.requiresTokens &&
        entity.tokens < skill.requiresTokens) return true;

    return false;
  }

  _getValidTargets(skill, enemies, allies, self) {
    if (skill.target === 'self')       return [self];
    if (skill.target === 'single_ally') return allies.filter(a => a.isAlive());
    if (skill.target === 'aoe')        return [enemies]; // groupe entier
    return enemies.filter(e => e.isAlive());
  }
}
```

**Tableau des contraintes gerees:**

| Contrainte | Regle |
|---|---|
| Budget PA | somme des couts <= PA disponibles du tour |
| Cooldown | une competence en cooldown est exclue |
| Unicite buff self | meme buff self non repetable dans un plan |
| Pre-requis ressource | charges, tokens, seuil de HP |
| Profondeur max | pas plus de 3 actions par tour |
| Plafond de plans | maximum 500 plans enumeres |
| Phase lock | certaines competences restreintes a une phase de boss |

### 6.3 Couche 2 — Evaluateur tactique

L'evaluateur attribue un score a chaque plan complet, pas a chaque action isolee.
C'est la difference fondamentale avec l'ancien systeme.

```javascript
class TacticalEvaluator {

  scorePlan(plan, entity, allies, enemies, playerHistory) {
    let score = 0;

    // Score cumule de chaque action du plan
    for (const step of plan) {
      if (step.action === 'defend') {
        score += this._scoreDefend(entity);
        continue;
      }
      score += this._scoreAction(step.skill, step.target, entity, enemies);
    }

    // Bonus de synergie entre actions du plan (combos)
    score += this._comboBonus(plan);

    // Bonus de prediction si profondeur activee
    score += this._predictionBonus(plan, entity, playerHistory);

    // Penalite de repetition du meme plan que le tour dernier
    score += this._patternPenalty(plan, entity);

    // Variance aleatoire controlee
    score += Math.random() * 8;

    return score;
  }

  // --- Scoring d'une action isolee ---

  _scoreAction(skill, target, caster, enemies) {
    let s = 0;

    // Degats estimes
    const targets = Array.isArray(target) ? target : [target];
    for (const t of targets) {
      const rawDmg = skill.power * (caster.atq / t.getEffDef());
      const mult   = t.getWeaknessMultiplier(skill.type, skill.id);
      const estDmg = rawDmg * mult;
      s += estDmg * 0.35;

      // Kill bonus
      if (estDmg >= t.hp)       s += 120;
      else if (estDmg >= t.hp * 0.5) s += 50;

      // Break bonus
      if (skill.breakDamage > 0) {
        const breakRemaining = t.maxBreak - t.breakGauge;
        if (skill.breakDamage >= breakRemaining) s += 80;
        else s += (skill.breakDamage / t.maxBreak) * 40;
      }

      // Bonus si cible deja en rupture
      if (t.isBroken()) s *= 1.4;
    }

    // Score effets de statut
    for (const eff of skill.effects) {
      if (eff.type === 'stun')           s += 35 * (eff.chance || 1);
      if (eff.type === 'def_down')       s += 25;
      if (eff.type === 'corruption')     s += eff.value * eff.duration * 0.8;
      if (eff.type === 'pa_regen_down')  s += 30;
      if (eff.type === 'purge_buff')     s += 20 * (eff.chance || 1);
      if (eff.type === 'steal_pa')       s += 35;
      if (eff.type === 'def_up')         s += 20;
      if (eff.type === 'evasion_up')     s += 25;
      if (eff.type === 'latence')        s += 15;
    }

    return s;
  }

  _scoreDefend(entity) {
    const hpRatio = entity.hp / entity.maxHp;
    if (hpRatio < 0.20) return 90;
    if (hpRatio < 0.40) return 50;
    return 10;
  }

  // --- Scoring des combos ---

  _comboBonus(plan) {
    let bonus = 0;
    const tags = plan
      .filter(s => s.skill)
      .flatMap(s => s.skill.comboTags);

    // Enchainement tactique: opener -> follow_up -> finisher
    const hasOpener   = tags.includes('opener');
    const hasFollowUp = tags.includes('follow_up');
    const hasFinisher = tags.includes('finisher');

    if (hasOpener && hasFollowUp)                bonus += 15;
    if (hasOpener && hasFollowUp && hasFinisher)  bonus += 35;
    if (hasOpener && hasFinisher && !hasFollowUp) bonus += 10;

    // Synergie debuff -> burst
    const hasDebuff = tags.includes('control') || tags.includes('strip');
    const hasBurst  = tags.includes('execute') || tags.includes('burst');
    if (hasDebuff && hasBurst) bonus += 25;

    // Synergie buff -> execution
    const hasBuff = tags.includes('buff');
    if (hasBuff && hasBurst) bonus += 20;

    // Synergie DoT + pressure
    const hasDot      = tags.includes('dot');
    const hasPressure = tags.includes('pressure');
    if (hasDot && hasPressure) bonus += 15;

    return bonus;
  }

  // --- Prediction du comportement joueur ---

  _predictionBonus(plan, entity, playerHistory) {
    if (!entity.aiProfile || entity.aiProfile.predictionDepth === 0) return 0;
    if (!playerHistory || playerHistory.length === 0) return 0;

    let bonus = 0;
    const lastActions = playerHistory.slice(-3);
    const profile     = this._analyzePlayerTendency(lastActions);

    // Joueur tres offensif -> bonus pour les plans defensifs
    if (profile.aggression > 0.6) {
      const hasDefensive = plan.some(s =>
        s.skill && (s.skill.comboTags.includes('buff') ||
                    s.action === 'defend'));
      if (hasDefensive) bonus += 25;
    }

    // Joueur tres defensif -> bonus ppur les plans agressifs
    if (profile.defensive > 0.5) {
      const hasAggro = plan.some(s =>
        s.skill && s.skill.comboTags.includes('execute'));
      if (hasAggro) bonus += 20;
    }

    // Joueur concentre sur la rupture -> bonus evasion/immunite
    if (profile.breakFocus > 0.4) bonus += 15;

    return bonus * (entity.aiProfile.predictionDepth / 3);
  }

  _analyzePlayerTendency(actions) {
    const total = actions.length || 1;
    return {
      aggression: actions.filter(a =>
        a.type === 'attack' || a.type === 'skill').length / total,
      defensive: actions.filter(a =>
        a.type === 'defend' || a.type === 'guard').length / total,
      breakFocus: actions.filter(a =>
        a.breakDamage && a.breakDamage > 0).length / total,
    };
  }

  // --- Anti-repetition ---

  _patternPenalty(plan, entity) {
    if (!entity.lastPlan) return 0;
    const lastIds = entity.lastPlan.map(s => s.skill?.id).join(',');
    const currIds = plan.map(s => s.skill?.id).join(',');
    if (lastIds === currIds) return -25;
    return 0;
  }
}
```

### 6.4 Couche 3 — Controleur de personnalite (IA symbolique)

C'est la couche qui decide quel plan executer parmi les N meilleurs.
Elle simule la "qualite de jeu" d'un ennemi sans toucher au code d'evaluation.

```javascript
class PersonalityController {

  /**
   * Selectionne un plan parmi les meilleurs selon le profil de personnalite.
   *
   * scoredPlans: tableau de { plan, score } trie par score decroissant.
   * profile: aiProfile de l'entite (selectionWeights, aggressiveness, etc.).
   */
  selectPlan(scoredPlans, profile) {
    // On garde les 4 meilleures options
    const candidates = scoredPlans.slice(0, 4);

    // Poids de selection selon la difficulte
    const weights = profile.selectionWeights;

    // Selection aleatoire ponderee
    const roll = Math.random();
    let cumul = 0;
    for (let i = 0; i < candidates.length; i++) {
      cumul += weights[i] || 0;
      if (roll < cumul) return candidates[i];
    }

    return candidates[0]; // fallback
  }

  /**
   * Applique les changements de phase si les conditions sont remplies.
   */
  checkPhaseTransition(entity) {
    for (const phase of entity.phases) {
      if (phase.applied) continue;

      let triggered = false;
      if (phase.trigger.hpBelow &&
          entity.hp / entity.maxHp <= phase.trigger.hpBelow) {
        triggered = true;
      }

      if (triggered) {
        const c = phase.changes;
        if (c.vit !== undefined)             entity.vit = c.vit;
        if (c.aggressiveness !== undefined)  entity.aiProfile.aggressiveness = c.aggressiveness;
        if (c.selectionWeights)              entity.aiProfile.selectionWeights = c.selectionWeights;
        if (c.comboAwareness !== undefined)  entity.aiProfile.comboAwareness = c.comboAwareness;
        if (c.preferSkills)                  entity.aiProfile.preferSkills = c.preferSkills;
        phase.applied = true;
      }
    }
  }
}
```

**Profils de difficulte:**

| Niveau | Poids [1er, 2eme, 3eme, 4eme] | Comportement |
|---:|---|---|
| 1 | [0.25, 0.45, 0.20, 0.10] | Souvent sub-optimal, imprevisible |
| 2 | [0.30, 0.55, 0.10, 0.05] | Choisit souvent le 2eme meilleur, raisonnable |
| 3 | [0.50, 0.35, 0.10, 0.05] | Bon joueur, choisit souvent le meilleur plan |
| 4 | [0.65, 0.25, 0.07, 0.03] | Expert, tres peu d'erreurs |
| 5 | [0.85, 0.10, 0.04, 0.01] | Quasi-parfait, boss final ou elite |

Quand un boss change de phase (HP < 50% par exemple), ses selectionWeights
et aggressiveness sont remplaces par ceux definis dans phases[].changes.

## 7. Systeme de combinaisons detaille

### 7.1 ComboTags — reference

Les comboTags definissent le role tactique d'une competence dans un plan:

| Tag | Role | Exemples |
|---|---|---|
| opener | Premiere action, setup | buff, debuff initial, DoT, scan |
| follow_up | Reponse ou amplification | attaque moyenne, controle, vol PA |
| finisher | Execution, gros impact | grosse attaque, KO, AoE |
| builder | Genere une ressource | attaque basique, charge d'exploit |
| control | Ralentit ou restreint | stun, latence, silence |
| pressure | Maintient la pression | multi-hit, DoT, AoE faible |
| strip | Retire des avantages | purge buff, annule shield |
| buff | Renforcement de soi | def up, evasion, regen |
| dot | Degats sur la duree | corruption, infection |
| burst | Gros degats concentres | crit boost, finisher |
| execute | Conditionnel: bonus si cible basse ou brisee | finisher conditionnel |
| support | Aide a un allie | shield, heal, PA share |
| scan | Lecture de cible | reveal, analyse |
| counter | Replique reactive | apres parry, apres esquive |

### 7.2 Exemples de combos ennemis

**Firewall basique (3 PA):**

| Plan | Actions | Tags | Bonus | Situation |
|---|---|---|---:|---|
| A | Block Port (1) + Rate Limit (2) | opener + follow_up | +15 | Standard |
| B | Block Port (1) + Deep Packet (2) | opener + strip | +15 | Anti-buff |
| C | Rate Limit (2) seul | follow_up | 0 | PA insuffisant pour combo |
| D | defend | — | situation | HP bas |

**Rootkit Alpha phase 1 (5 PA):**

| Plan | Actions | Tags | Bonus | Situation |
|---|---|---|---:|---|
| A | Hide Process (2) + Privilege Escalation (3) | buff + execute | +20 | Attaque protegee |
| B | System Corruption (2) + Privilege Escalation (3) | dot + execute | +25 | Pression max |
| C | Root Access (4) seul | AoE pressure | 0 | Groupe joueur groupe |
| D | Hide Process (2) + System Corruption (2) | buff + dot | +15 | Defensif/attrition |

**Rootkit Alpha phase 2 (5 PA, HP < 50%):**

Les selectionWeights passent a [0.65, 0.25, 0.07, 0.03].
Le plan B (dot + execute) est favorise dans le scoring.
Le plan D (defensif/attrition) perd du score.

### 7.3 Combos joueur connus par l'IA de prediction

L'IA doit connaitre les patterns de combo possibles d'Elior et Mira
pour anticiper et contrer intelligemment.

| Combo joueur | PA | Actions | Menace pour l'IA |
|---|---:|---|---|
| Break Rush | 5 | Kernel Patch (4) + Ping Sweep (1) | Rupture + charge |
| Scan & Crack | 3 | Port Scan (1) + Hash Burst (2) | Revele + Token |
| Full Exploit | 7 | Kernel Patch (4) + SQL Injection (3) | Break + burst sur faiblesse |
| Token Storm | 6 | Hash Burst x2 (4) + Salt Shield (2) | 2 Tokens + bouclier |
| Ultimate Setup | 10+ | Kernel Patch (4) + Zero-Day (6+10ch) | Si charges dispo: devastateur |
| Analyze & Punish | 6 | Deep Scan (2) + Sandbox Isolation (4) | Revele tout + control |
| Disruption Totale | 8 | Prompt Poisoning (5) + Man in the Middle (3+1T) | Confus + vol PA |

L'IA regarde l'historique et les PA/ressources du joueur.
Si le joueur a 4+ PA et a utilise Port Scan au tour precedent,
la probabilite d'une attaque exploit augmente,
et le plan "Hide Process + defend" gagne du score dans l'evaluateur.

## 8. Prediction des mouvements joueur

### 8.1 Approche

Pas de vrai minimax en temps reel. A la place, un systeme d'heuristiques legeres
base sur:

- historique des 3-5 derniers tours;
- PA restants du joueur;
- ressources du joueur (charges d'exploit, tokens);
- etat de la jauge de rupture de l'ennemi;
- HP des deux cotes.

### 8.2 Predicteur

```javascript
class PlayerPredictor {

  predict(playerParty, history, enemy) {
    const predictions = [];
    const elior = playerParty.find(p => p.id === 'elior');
    const mira  = playerParty.find(p => p.id === 'mira');

    // Rupture proche -> joueur va tenter de break
    if (enemy.breakGauge > enemy.maxBreak * 0.7) {
      predictions.push({ action: 'break_attempt', confidence: 0.7 });
    }

    // Charges accumulees -> Zero-Day probable
    if (elior && elior.exploitCharges >= 8) {
      predictions.push({ action: 'zero_day_setup', confidence: 0.6 });
    }

    // Beaucoup de PA -> combo lourd probable
    if (elior && elior.pa >= 4) {
      predictions.push({ action: 'heavy_combo', confidence: 0.5 });
    }

    // Tokens accumules par Mira -> RSA Crack probable
    if (mira && mira.tokens >= 2 && mira.pa >= 4) {
      predictions.push({ action: 'mira_burst', confidence: 0.5 });
    }

    // Analyse de pattern: si le dernier tour etait un opener
    if (history.length >= 2) {
      const last = history[history.length - 1];
      if (last.some(a => a.skill?.comboTags.includes('opener'))) {
        predictions.push({ action: 'follow_up_burst', confidence: 0.55 });
      }
    }

    // HP joueur bas -> probable heal, guard ou objet
    if (elior && elior.hp < elior.maxHp * 0.3) {
      predictions.push({ action: 'defensive_turn', confidence: 0.6 });
    }

    return predictions;
  }
}
```

### 8.3 Utilisation des predictions par l'evaluateur

- prediction "break_attempt" -> bonus aux plans qui buff DEF ou evasion;
- prediction "defensive_turn" -> bonus aux plans d'attaque aggressive;
- prediction "heavy_combo" -> bonus aux plans avec stun ou interruption;
- prediction "zero_day_setup" -> bonus aux plans qui appliquent blindage;
- prediction "mira_burst" -> bonus concentration d'attaque sur Mira.

## 9. Reactions du joueur pendant le tour ennemi

### 9.1 Parametres de reaction par attaque

Chaque attaque ennemie dispose d'un bloc reactable dans son JSON:

```json
{
  "reactable": {
    "blockable": true,
    "parryable": true,
    "dodgeable": false,
    "parryWindow": 0.25,
    "telegraphDuration": 1.2
  }
}
```

- blockable: le joueur peut lever sa garde pour reduire les degats;
- parryable: une fenetre de parry precis est offerte;
- dodgeable: le joueur peut esquiver completement;
- parryWindow: duree en secondes de la fenetre de parry;
- telegraphDuration: temps entre le telegraph visuel et l'impact.

### 9.2 Anti-pattern joueur

Si le joueur reussit 3 parades consecutives, l'IA ajuste:

```javascript
function adjustForPlayerReactions(plan, entity, parrySuccessHistory) {
  const recentParries = parrySuccessHistory.slice(-5);
  const parryRate     = recentParries.filter(p => p).length / recentParries.length;

  if (parryRate > 0.6) {
    // Le joueur parry souvent -> favoriser des attaques non-parriable
    for (const step of plan) {
      if (step.skill?.reactable && !step.skill.reactable.parryable) {
        step.bonusScore = 15;
      }
      // Favoriser les telegraphes courts
      if (step.skill?.reactable?.telegraphDuration < 0.7) {
        step.bonusScore = (step.bonusScore || 0) + 10;
      }
    }
  }
}
```

### 9.3 Feintes (boss avances)

Les boss de niveau 4+ peuvent utiliser des feintes:

- un faux telegraph est joue, suivi d'une pause;
- l'attaque reelle arrive avec un timing different;
- le joueur qui tente de parry sur le faux telegraph est puni.

Cela se configure dans le JSON de la competence:

```json
{
  "reactable": {
    "blockable": true,
    "parryable": true,
    "dodgeable": false,
    "parryWindow": 0.20,
    "telegraphDuration": 1.5,
    "feint": {
      "enabled": true,
      "fakeDelay": 0.8,
      "realDelay": 1.5
    }
  }
}
```

## 10. Orchestrateur de tour complet

```javascript
class AIEngine {

  constructor() {
    this.planner     = new ActionPlanner();
    this.evaluator   = new TacticalEvaluator();
    this.controller  = new PersonalityController();
    this.predictor   = new PlayerPredictor();
  }

  /**
   * Point d'entree principal: calcule le plan d'action pour un ennemi.
   */
  computeTurn(entity, allies, enemies, playerParty, playerHistory) {

    // Verifier transition de phase
    this.controller.checkPhaseTransition(entity);

    // Couche 1: Generer les plans legaux
    const plans = this.planner.generatePlans(entity, allies, enemies);

    // Couche 2: Evaluer et scorer chaque plan
    const scoredPlans = plans
      .map(plan => ({
        plan,
        score: this.evaluator.scorePlan(
          plan, entity, allies, enemies, playerHistory
        )
      }))
      .sort((a, b) => b.score - a.score);

    // Couche 3: Selectionner selon le profil de personnalite
    const selected = this.controller.selectPlan(scoredPlans, entity.aiProfile);

    // Memoriser le plan pour la penalite anti-repetition
    entity.lastPlan = selected.plan;

    return selected;
  }
}
```

Usage dans la boucle de combat:

```javascript
const aiEngine = new AIEngine();

function enemyTurn(enemy, playerParty, playerHistory) {
  const result = aiEngine.computeTurn(
    enemy,
    [],            // allies de l'ennemi (si plusieurs ennemis)
    playerParty,   // les joueurs sont les "ennemis" du point de vue IA
    playerParty,
    playerHistory
  );

  // Executer chaque action du plan sequentiellement
  for (const step of result.plan) {
    if (step.action === 'defend') {
      executeDefend(enemy);
    } else {
      executeSkill(enemy, step.skill, step.target);
    }
  }
}
```

## 11. Comparaison avec l'ancien systeme

| Aspect | Ancien (scoring lineaire) | Nouveau (pipeline 3 couches) |
|---|---|---|
| Raisonnement | 1 action a la fois | Plans multi-actions complets |
| Combos | Aucun | comboTags + bonus synergie |
| Difficulte | Variance aleatoire | Profil de personnalite pondere |
| Prediction joueur | Aucune ou basique | Historique 3-5 tours, heuristiques |
| Break awareness | Non | Score break dans l'evaluation |
| Phase boss | Flag bool | Donnees JSON par phase avec transitions |
| Extensibilite | Code specifique par boss | Tout en JSON, le code IA est identique |
| Reactions joueur | Ignorees | reactable par attaque + anti-pattern |
| Combos joueur | Ignores | Prediction des combos via historique |

## 12. Performance et garde-fous

### 12.1 Complexite

Avec 5 PA et 4 competences, les plans possibles restent gerables:

- profondeur max 3 actions par plan;
- pruning par contraintes elimine la majorite des branches;
- budget PA reduit rapidement l'espace de recherche;
- ~50 a 200 plans evalues pour un boss: bien sous 1 ms.

### 12.2 Garde-fous

| Garde-fou | Valeur | Raison |
|---|---|---|
| Profondeur max d'enumeration | 3 | Limiter l'explosion combinatoire |
| Nombre max de plans evalues | 500 | Eviter les freezes |
| Timeout soft | 2 ms | Couper si trop lent, evaluer ce qui est genere |
| Cache de fragments de plan | optionnel | Reutiliser des sous-plans recurrents |

## 13. Integration avec le cahier des charges

Ce systeme sert directement les mecaniques du CAHIER_DES_CHARGES_ELIOR.md:

| Mecanique du cahier | Composant IA |
|---|---|
| Combat reactif | reactable par attaque + telegraph + feintes |
| Faiblesses/resistances | Entity.weaknesses lu depuis JSON |
| Rupture / Break | breakGauge + breakDamage dans Skill + scoring |
| Synergies Elior/Mira | comboTags + prediction des combos joueur |
| Profil de boss | phases JSON + selectionWeights dynamiques |
| Difficulte progressive | Controleur de personnalite + niveaux 1-5 |
| Robot compagnon scan | Revele les donnees que l'IA utilise deja en interne |
| Formule de degats | power * (ATQ / DEF_cible) * multiplier de faiblesse |

## 14. Prochaines etapes d'implementation

1. Implementer Entity + Skill en classes JS.
2. Creer les fichiers JSON: firewall_basic.json, malware_trojan.json, rootkit_alpha.json.
3. Creer les fichiers JSON joueur: elior.json, mira.json.
4. Coder ActionPlanner avec enumeration contrainte.
5. Coder TacticalEvaluator avec scoring multi-factoriel et combos.
6. Coder PersonalityController avec selection ponderee.
7. Coder PlayerPredictor avec heuristiques sur historique.
8. Brancher AIEngine sur le combat existant dans override_campus_zero.html.
9. Tester avec le Firewall basique: verifier combos, difficulte, variete.
10. Tester avec le Rootkit Alpha: verifier phases, prediction, break, feintes.

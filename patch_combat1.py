#!/usr/bin/env python3
import sys

filepath = "override_campus_zero (2).html"

with open(filepath, 'rb') as f:
    content = f.read()

text = content.decode('utf-8')

start_marker = "const COMBAT = {"
end_marker = "endCombat: function() {"

start_idx = text.find(start_marker)
if start_idx == -1:
    print("Error: start_marker not found")
    sys.exit(1)

end_func_idx = text.find(end_marker, start_idx)
if end_func_idx == -1:
    print("Error: end_marker not found")
    sys.exit(1)

# Find end of COMBAT object by balancing braces from start_marker
brace_count = 0
in_obj = False
end_obj_idx = start_idx
for i in range(start_idx, len(text)):
    if text[i] == '{':
        brace_count += 1
        in_obj = True
    elif text[i] == '}':
        brace_count -= 1
        if in_obj and brace_count == 0:
            end_obj_idx = i + 1
            break

# Also include the trailing ';' if present
if end_obj_idx < len(text) and text[end_obj_idx] == ';':
    end_obj_idx += 1

new_combat_code = """const COMBAT = {
  active: false,
  turn: 'NONE', // 'PLAYER', 'ENEMY', 'BUSY'
  enemyMesh: null,
  playerMesh: null,
  camera: null,
  scene: null,
  cameraStabilizerObserver: null,
  cameraFocusTurn: 'PLAYER',
  prevCameraState: null,
  
  // IA & Entities
  playerEntity: null,
  enemyEntity: null,
  aiEngine: null,

  calcDamage: function(attacker, defender, skill) {
    let baseAtk = attacker.atk || 10;
    let baseDef = defender.def || 5;
    
    if (defender.guarding) {
        baseDef *= 2; 
    }

    let pow = skill.power || 0;
    let d = (baseAtk + pow) - Math.floor(baseDef / 2);
    
    if (defender.guarding) {
        d = Math.floor(d * 0.5); 
        defender.guarding = false; // La garde encaisse un coup et se dissipe
    }
    
    return Math.max(1, d); 
  },

  abilityCards: [
    {
      id: "strike_basic",
      name: "Frappe Basique",
      description: "Attaque rapide. (+1 PA)",
      key: "1",
      paCost: 0,
      animationKey: "atk1",
      unlocks: ["strike_charged"],
    },
    {
      id: "guard",
      name: "Posture Défensive",
      description: "Encaisse le prochain coup. (+3 PA)",
      key: "2",
      paCost: 0,
      animationKey: "idle",
      unlocks: [],
    },
    {
      id: "strike_charged",
      name: "Frappe Chargée",
      description: "Consomme TOUS les PA pour d'énormes dégâts (1.3^PA).",
      key: "3",
      paCost: 1, // Minimum
      animationKey: "atk2",
      unlocks: [],
    },
    {
      id: "qcm",
      name: "Piratage (QCM)",
      description: "Piratez pour obtenir un objet ! (Action Libre)",
      key: "4",
      paCost: 2,
      animationKey: "idle",
      unlocks: [],
    },
    {
      id: "inventory",
      name: "Inventaire",
      description: "Utilisez vos objets de combat. (Action Libre)",
      key: "5",
      paCost: 0,
      animationKey: "idle",
      unlocks: [],
    }
  ],
  unlockedAbilityCards: null,
  abilityCooldowns: null,
  abilityCooldownMs: 1400,
  selectedAbilityCardId: null,

  getAvailableAbilityCards: function() {
    if (!this.unlockedAbilityCards) return [];
    return this.abilityCards
      .filter((card) => this.unlockedAbilityCards.has(card.id))
      .sort((a, b) => a.key.localeCompare(b.key));
  },

  isAbilityOnCooldown: function(cardId) {
    if (!this.abilityCooldowns) return false;
    const endTs = this.abilityCooldowns.get(cardId) || 0;
    return Date.now() < endTs;
  },

  renderAbilityMenu: function() {
    const menu = document.getElementById("cMenu");
    if (!menu) return;
    const cards = this.getAvailableAbilityCards();
    if (!this.selectedAbilityCardId || !cards.some((c) => c.id === this.selectedAbilityCardId)) {
      this.selectedAbilityCardId = cards[0]?.id || null;
    }
    menu.innerHTML = cards.map((card) => {
      const isCd = this.isAbilityOnCooldown(card.id);
      let costStr = card.paCost + " PA";
      if (card.id === "strike_charged") costStr = "TOUS LES PA (Min 1)";
      if (card.id === "inventory") costStr = "Action Libre";
      if (card.paCost === 0 && card.id !== "inventory") costStr = "Génère PA";
      const cd = isCd ? "COOLDOWN" : costStr;
      const isActive = this.selectedAbilityCardId === card.id;
      return `
        <div class="action-box ${isActive ? "active" : ""} ${isCd ? "cooldown" : ""}">
          <span class="hotkey">${card.key}</span>
          <div class="content">
            <div class="act-name">${card.name}</div>
            <div class="act-desc">${card.description}</div>
            <div class="act-cost">Coût: ${cd}</div>
          </div>
        </div>
      `;
    }).join("");
  },

  useAbilityCard: function(card) {
    if (this.turn !== 'PLAYER' || !card) return;
    if (!this.unlockedAbilityCards || !this.unlockedAbilityCards.has(card.id)) return;
    if (this.isAbilityOnCooldown(card.id)) return this.log(card.name + " est en cooldown.");
    
    let cost = card.paCost || 0;
    if (card.id === "strike_charged") cost = 1;

    if ((this.playerEntity.pa || 0) < cost) return this.log("Pas assez de PA !");

    this.setTurn('BUSY');
    let endsTurn = true;

    if (window.playerEntityObj && card.animationKey) {
      window.playerEntityObj.playAnim(card.animationKey);
    }

    if (card.id === "strike_basic") {
      this.playerEntity.pa += 1;
      const dmg = this.calcDamage(this.playerEntity, this.enemyEntity, { power: 15 });
      if (this.enemyEntity.applyDamage) this.enemyEntity.applyDamage(dmg); else this.enemyEntity.hp -= dmg;
      this.log("FRAPPE BASIQUE : " + dmg + " dégâts. (+1 PA)");
    } 
    else if (card.id === "guard") {
      this.playerEntity.pa += 3;
      this.playerEntity.guarding = true;
      this.log("POSTURE DÉFENSIVE : Vous encaissez le prochain coup ! (+3 PA)");
    } 
    else if (card.id === "strike_charged") {
      const paInvested = this.playerEntity.pa;
      this.playerEntity.pa = 0;
      const baseDmg = this.calcDamage(this.playerEntity, this.enemyEntity, { power: 15 });
      const dmg = Math.floor(baseDmg * Math.pow(1.3, paInvested));
      if (this.enemyEntity.applyDamage) this.enemyEntity.applyDamage(dmg); else this.enemyEntity.hp -= dmg;
      this.log("FRAPPE CHARGÉE (" + paInvested + " PA) : " + dmg + " DÉGÂTS !!!");
    } 
    else if (card.id === "qcm") {
      this.playerEntity.pa -= 2;
      endsTurn = false; 
      this.showQCM();
      return; 
    } 
    else if (card.id === "inventory") {
      endsTurn = false;
      this.showInventoryMenu();
      return;
    }

    (card.unlocks || []).forEach((unlockId) => {
      const exists = this.abilityCards.some((c) => c.id === unlockId);
      if (exists && this.unlockedAbilityCards && !this.unlockedAbilityCards.has(unlockId)) {
        this.unlockedAbilityCards.add(unlockId);
      }
    });

    if (this.abilityCooldowns) {
      this.abilityCooldowns.set(card.id, Date.now() + this.abilityCooldownMs);
      setTimeout(() => this.updateUI(), this.abilityCooldownMs + 20);
    }

    this.updateUI();
    if (endsTurn) {
        setTimeout(() => this.checkWinLoss('ENEMY'), 1100);
    } else {
        setTimeout(() => this.setTurn('PLAYER'), 500);
    }
  },

  showQCM: function() {
    this.log("Piratage QCM en cours...");
    const qcmDiv = document.createElement("div");
    qcmDiv.id = "qcmOverlay";
    qcmDiv.style.position = "absolute";
    qcmDiv.style.top = "20%";
    qcmDiv.style.left = "50%";
    qcmDiv.style.transform = "translateX(-50%)";
    qcmDiv.style.backgroundColor = "rgba(10, 20, 30, 0.95)";
    qcmDiv.style.border = "2px solid #00ffcc";
    qcmDiv.style.padding = "20px";
    qcmDiv.style.color = "white";
    qcmDiv.style.zIndex = "1000";
    qcmDiv.style.width = "400px";
    qcmDiv.style.textAlign = "center";
    qcmDiv.style.fontFamily = "monospace";
    qcmDiv.style.boxShadow = "0 0 15px #00ffcc";

    const questions = [
        { q: "Que signifie IA ?", options: ["Intelligence Artificielle", "Informatique Avancée", "Interface Active"], ans: 0 },
        { q: "Quel langage est utilisé dans Babylon.js ?", options: ["Python", "JavaScript/TypeScript", "C++"], ans: 1 },
        { q: "Que fait une boucle 'for' ?", options: ["Répète des instructions", "Affiche une erreur", "Ferme le programme"], ans: 0 },
        { q: "Qu'est-ce qu'un Mesh 3D ?", options: ["Un son", "Un objet tridimensionnel", "Une variable"], ans: 1 }
    ];
    const q = questions[Math.floor(Math.random() * questions.length)];

    let html = `<h3>SYSTÈME DE PIRATAGE QCM</h3><p style="font-size:16px;">${q.q}</p>`;
    q.options.forEach((opt, idx) => {
        html += `<button onclick="COMBAT.answerQCM(${idx}, ${q.ans})" style="display:block; width:100%; margin:8px 0; padding:10px; background:#111; color:#00ffcc; border:1px solid #00ffcc; cursor:pointer; font-size:14px; transition:0.2s;" onmouseover="this.style.background='#00ffcc';this.style.color='black';" onmouseout="this.style.background='#111';this.style.color='#00ffcc';">${opt}</button>`;
    });
    
    qcmDiv.innerHTML = html;
    document.body.appendChild(qcmDiv);
  },

  answerQCM: function(chosenIdx, correctIdx) {
    const qcmDiv = document.getElementById("qcmOverlay");
    if (qcmDiv) qcmDiv.remove();

    if (chosenIdx === correctIdx) {
        const loots = ["potion_50", "pa_battery", "stun_bomb"];
        const loot = loots[Math.floor(Math.random() * loots.length)];
        this.playerEntity.inventory[loot] = (this.playerEntity.inventory[loot] || 0) + 1;
        
        let lootName = loot === "potion_50" ? "Potion Soin 50%" : (loot === "pa_battery" ? "Batterie (+4 PA)" : "Grenade Stun");
        this.log("Piratage RÉUSSI ! Vous obtenez : " + lootName);
    } else {
        this.log("Piratage ÉCHOUÉ ! Système bloqué.");
    }

    this.updateUI();
    this.setTurn('PLAYER'); 
  },

  showInventoryMenu: function() {
    const menu = document.getElementById("cMenu");
    let html = `<div style="color:white; font-family:monospace; margin-bottom:10px; font-weight:bold;">INVENTAIRE (Action Libre)</div>`;
    
    const items = [
        { id: "potion_50", name: "Potion de Soin 50%", desc: "Restaure 50% de vos HP max" },
        { id: "pa_battery", name: "Batterie PA", desc: "Donne immédiatement 4 PA" },
        { id: "stun_bomb", name: "Grenade Stun", desc: "Paralyse l'adversaire au prochain tour" }
    ];

    let hasItem = false;
    items.forEach(item => {
        const qty = this.playerEntity.inventory[item.id] || 0;
        if (qty > 0) {
            hasItem = true;
            html += `<button onclick="COMBAT.useItem('${item.id}')" style="display:block; width:100%; margin:5px 0; padding:10px; background:#111; color:#00ffcc; border:1px solid #00ffcc; cursor:pointer; text-align:left; font-family:monospace;">
                [${qty}x] ${item.name} - ${item.desc}
            </button>`;
        }
    });

    if (!hasItem) {
        html += `<p style="color:#ff4444; font-family:monospace;">Inventaire vide. Utilisez le QCM pour trouver des objets.</p>`;
    }

    html += `<button onclick="COMBAT.cancelInventory()" style="display:block; width:100%; margin:15px 0; padding:10px; background:#333; color:white; border:none; cursor:pointer; font-family:monospace;">Retour aux Attaques</button>`;
    
    menu.innerHTML = html;
  },

  cancelInventory: function() {
      this.updateUI(); 
      this.setTurn('PLAYER');
  },

  useItem: function(itemId) {
      if (!this.playerEntity.inventory[itemId]) return;
      this.playerEntity.inventory[itemId]--;
      
      this.setTurn('BUSY');

      if (itemId === "potion_50") {
          const heal = Math.floor(this.playerEntity.maxHp * 0.5);
          this.playerEntity.hp = Math.min(this.playerEntity.maxHp, this.playerEntity.hp + heal);
          this.log("OBJET UTILISÉ : Soin de " + heal + " HP.");
      } else if (itemId === "pa_battery") {
          this.playerEntity.pa += 4;
          this.log("OBJET UTILISÉ : +4 PA obtenus.");
      } else if (itemId === "stun_bomb") {
          this.enemyEntity.stunned = true;
          this.log("OBJET UTILISÉ : L'ennemi est paralysé pour son tour !");
      }

      this.updateUI();
      setTimeout(() => this.setTurn('PLAYER'), 800);
  },

  handleInput: function(evt) {
    if (this.turn !== 'PLAYER') return;
    const key = (evt.key || "").trim();
    if (!/^\d$/.test(key)) return;
    const card = this.getAvailableAbilityCards().find((c) => c.key === key);
    if (card) {
      this.selectedAbilityCardId = card.id;
      this.updateUI();
      this.useAbilityCard(card);
    }
  },

  init: function(scene, camera, player, enemy) {
    this.active = true;
    this.enemyMesh = enemy;
    this.playerMesh = player.mesh;
    this.camera = camera;
    this.scene = scene;
    this.turn = 'BUSY';
    this.cameraFocusTurn = 'PLAYER';
    this.unlockedAbilityCards = new Set(["strike_basic", "guard", "strike_charged", "qcm", "inventory"]);
    this.abilityCooldowns = new Map();
    this.selectedAbilityCardId = "strike_basic";
    
    if (typeof AIEngine !== "undefined") this.aiEngine = new AIEngine();
    
    this.playerEntity = new Entity({
        id: "hero1", name: "Player", hp: 1000, maxHp: 1000, maxPa: 10, pa: 2, atk: 30, def: 5
    });
    this.playerEntity.inventory = { "potion_50": 1, "pa_battery": 1, "stun_bomb": 0 };
    this.playerEntity.guarding = false;
    this.playerEntity.stunned = false;

    this.enemyEntity = new Entity({
        id: "boss1", name: "Alpha", hp: 2000, maxHp: 2000, maxPa: 10, pa: 2, atk: 40, def: 10
    });
    this.enemyEntity.inventory = { "potion_50": 2, "pa_battery": 0, "stun_bomb": 1 };
    this.enemyEntity.guarding = false;
    this.enemyEntity.stunned = false;

    if (this.scene) {
      this.boundInputHandler = this.handleInput.bind(this);
      window.addEventListener("keydown", this.boundInputHandler);

      this.prevCameraState = {
        target: this.camera.target.clone(),
        alpha: this.camera.alpha,
        beta: this.camera.beta,
        radius: this.camera.radius,
      };

      this.camera.detachControl();
      
      this.cameraStabilizerObserver = this.scene.onBeforeRenderObservable.add(() => {
        if (!this.active || !this.camera) return;
        const actor = this.cameraFocusTurn === 'ENEMY' ? this.enemyMesh : this.playerMesh;
        const opponent = this.cameraFocusTurn === 'ENEMY' ? this.playerMesh : this.enemyMesh;
        if (!actor || !opponent || actor.isDisposed?.() || opponent.isDisposed?.()) return;

        const actorEye = actor.position.add(new BABYLON.Vector3(0, 1.05, 0));
        const toOpponent = opponent.position.subtract(actor.position);
        toOpponent.y = 0;

        if (toOpponent.lengthSquared() > 0.0001) {
          toOpponent.normalize();
        } else {
          toOpponent.set(Math.cos(this.camera.alpha), 0, Math.sin(this.camera.alpha));
        }

        const backDir = toOpponent.scale(-1);
        const desiredAlpha = Math.atan2(backDir.z, backDir.x);
        this.camera.target = BABYLON.Vector3.Lerp(this.camera.target, actorEye, 0.26);
        
        let dAlpha = desiredAlpha - this.camera.alpha;
        while (dAlpha > Math.PI) dAlpha -= Math.PI * 2;
        while (dAlpha < -Math.PI) dAlpha += Math.PI * 2;
        this.camera.alpha += dAlpha * 0.22;
        
        this.camera.beta = BABYLON.Scalar.Lerp(this.camera.beta, Math.PI / 2.25, 0.22);
        this.camera.radius = BABYLON.Scalar.Lerp(this.camera.radius, 8.8, 0.20);
        this.camera.inertialAlphaOffset = 0;
        this.camera.inertialBetaOffset = 0;
        this.camera.inertialRadiusOffset = 0;
      });
    }

    document.body.classList.add("combat-mode");
    document.getElementById("hud").style.display = "none";
    document.getElementById("combatUI").style.display = "block";
    this.updateUI();
    this.log("COMBAT INITIÉ. VOS RÈGLES SONT APPLIQUÉES.");

    setTimeout(() => this.setTurn('PLAYER'), 1500);
  },

  log: function(msg) { document.getElementById("cLog").textContent = msg; },

  updateUI: function() {
    if(!this.playerEntity) return;
    document.getElementById("cHpj").textContent = this.playerEntity.hp + " / " + this.playerEntity.maxHp + " (PA: " + this.playerEntity.pa + ")";
    document.getElementById("cMpj").textContent = this.playerEntity.guarding ? "[GARDE ACTIVE]" : ""; 
    document.getElementById("cHpe").textContent = this.enemyEntity.hp + " / " + this.enemyEntity.maxHp + " (PA: " + this.enemyEntity.pa + ")";
    
    let totalItems = (this.playerEntity.inventory["potion_50"] || 0) + (this.playerEntity.inventory["pa_battery"] || 0) + (this.playerEntity.inventory["stun_bomb"] || 0);
    const potEl = document.getElementById("cPot");
    if (potEl) potEl.textContent = totalItems;

    const menu = document.getElementById("cMenu");
    if (menu) {
      menu.style.opacity = (this.turn === 'PLAYER') ? "1" : "0.3";
      this.renderAbilityMenu();
    }
  },

  setTurn: function(who) {
    this.turn = who;
    
    if (who === 'PLAYER') {
      this.cameraFocusTurn = 'PLAYER';
      this.log("VOTRE TOUR. Choisissez une action.");
    } else if (who === 'ENEMY') {
      this.cameraFocusTurn = 'ENEMY';
      setTimeout(() => this.enemyAI(), 1000);
    }
    this.updateUI();
  },

  enemyAI: async function() {
    this.log("L'Entité Alpha réfléchit...");
    await new Promise(r => setTimeout(r, 1000));

    if (this.enemyEntity.stunned) {
        this.log("L'Entité Alpha est PARALYSÉE ! Elle passe son tour.");
        this.enemyEntity.stunned = false;
        await new Promise(r => setTimeout(r, 1500));
        return this.checkWinLoss('PLAYER');
    }

    // 1. Soin si HP faibles
    if (this.enemyEntity.hp < this.enemyEntity.maxHp * 0.4 && this.enemyEntity.inventory["potion_50"] > 0) {
        this.enemyEntity.inventory["potion_50"]--;
        const heal = Math.floor(this.enemyEntity.maxHp * 0.5);
        this.enemyEntity.hp = Math.min(this.enemyEntity.maxHp, this.enemyEntity.hp + heal);
        this.log("ALPHA UTILISE : Potion de Soin (+50% HP) !");
        this.updateUI();
        await new Promise(r => setTimeout(r, 1500));
    }

    // 2. Si le joueur a beaucoup de PA, l'IA utilise une stun bomb pour le bloquer
    if (this.playerEntity.pa >= 4 && this.enemyEntity.inventory["stun_bomb"] > 0) {
        this.enemyEntity.inventory["stun_bomb"]--;
        this.playerEntity.stunned = true;
        this.log("ALPHA UTILISE : Grenade Stun ! Vous serez paralysé !");
        this.updateUI();
        await new Promise(r => setTimeout(r, 1500));
    }

    // 3. Choix de l'attaque
    let actionType = "basic"; 

    if (this.enemyEntity.pa >= 3) {
        actionType = "charged"; // Burst si on a des PA
    } else if (this.enemyEntity.pa < 2) {
        actionType = Math.random() > 0.5 ? "guard" : "basic"; // Farm de PA
    }

    if (actionType === "guard") {
        this.enemyEntity.pa += 3;
        this.enemyEntity.guarding = true;
        this.log("ALPHA UTILISE : Posture Défensive (+3 PA) !");
    } else if (actionType === "basic") {
        this.enemyEntity.pa += 1;
        const dmg = this.calcDamage(this.enemyEntity, this.playerEntity, { power: 15 });
        if (this.playerEntity.applyDamage) this.playerEntity.applyDamage(dmg); else this.playerEntity.hp -= dmg;
        this.log("ALPHA UTILISE : Frappe Basique (" + dmg + " dégâts, +1 PA)");
    } else if (actionType === "charged") {
        const paInvested = this.enemyEntity.pa;
        this.enemyEntity.pa = 0;
        const baseDmg = this.calcDamage(this.enemyEntity, this.playerEntity, { power: 15 });
        const dmg = Math.floor(baseDmg * Math.pow(1.3, paInvested));
        if (this.playerEntity.applyDamage) this.playerEntity.applyDamage(dmg); else this.playerEntity.hp -= dmg;
        this.log("ALPHA UTILISE : Frappe Chargée (" + paInvested + " PA) -> " + dmg + " DÉGÂTS !!!");
    }

    this.updateUI();
    await new Promise(r => setTimeout(r, 1500));

    this.checkWinLoss('PLAYER');
  },

  checkWinLoss: function(nextTurn) {
    this.updateUI();
    setTimeout(() => {
      if (this.enemyEntity.hp <= 0) {
        this.log("VICTOIRE ! ENTITÉ DÉTRUITE.");
        if (this.enemyMesh && !this.enemyMesh.isDisposed()) {
            this.enemyMesh.dispose();
        }
        setTimeout(() => this.endCombat(), 2000);
      } else if (this.playerEntity.hp <= 0) {
        this.log("SYSTÈME CRITIQUE. VOUS ÊTES MORT.");
        setTimeout(() => location.reload(), 3000);
      } else {
        if (nextTurn === 'PLAYER' && this.playerEntity.stunned) {
            this.log("VOUS ÊTES PARALYSÉ ! Tour passé.");
            this.playerEntity.stunned = false;
            setTimeout(() => this.setTurn('ENEMY'), 1500);
        } else {
            this.setTurn(nextTurn);
        }
      }
    }, 500);
  },

  endCombat: function() {
"""

text = text[:start_idx] + new_combat_code + text[end_func_idx + len("endCombat: function() {"):]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Combat patch applied successfully!")

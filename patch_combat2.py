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

if end_obj_idx < len(text) and text[end_obj_idx] == ';':
    end_obj_idx += 1

new_combat_code = """const COMBAT = {
  active: false,
  turn: 'NONE', // 'PLAYER', 'ENEMY', 'BUSY'
  combatMenuState: 'MAIN', // MAIN, INVENTORY, CHARGED_STRIKE
  enemyMesh: null,
  playerMesh: null,
  camera: null,
  scene: null,
  cameraStabilizerObserver: null,
  cameraFocusTurn: 'PLAYER',
  prevCameraState: null,
  
  playerEntity: null,
  enemyEntity: null,
  aiEngine: null,

  calcDamage: function(attacker, defender, skill) {
    let baseAtk = attacker.atk || 10;
    let baseDef = defender.def || 5;
    
    if (defender.guarding) baseDef *= 2; 

    let pow = skill.power || 0;
    let d = (baseAtk + pow) - Math.floor(baseDef / 2);
    
    if (defender.guarding) {
        d = Math.floor(d * 0.5); 
        defender.guarding = false; 
    }
    
    // Bouclier de données
    if (defender.shieldTurns && defender.shieldTurns > 0) {
        d = Math.floor(d * 0.5);
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
      unlocks: [],
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
      description: "Consomme les PA de votre choix (1.3^PA).",
      key: "3",
      paCost: 1, 
      animationKey: "atk2",
      unlocks: [],
    },
    {
      id: "qcm",
      name: "Piratage (QCM)",
      description: "Piratez pour obtenir un objet ! (Risqué)",
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

    // === SOUS-MENU INVENTAIRE ===
    if (this.combatMenuState === 'INVENTORY') {
        let html = `<div style="color:white; font-family:monospace; margin-bottom:10px; font-weight:bold;">INVENTAIRE (Action Libre)</div>`;
        const itemsInfo = {
            "potion_50": { name: "Potion de Soin 50%", desc: "Restaure 50% de vos HP max" },
            "pa_battery": { name: "Batterie PA", desc: "Donne immédiatement 4 PA" },
            "stun_bomb": { name: "Grenade Stun", desc: "Paralyse l'adversaire (1 tour)" },
            "data_shield": { name: "Bouclier de Données", desc: "Dégâts reçus réduits de 50% (2 tours)" }
        };

        let hasItem = false;
        let keyIdx = 1;
        for (let itemId in itemsInfo) {
            const qty = this.playerEntity.inventory[itemId] || 0;
            if (qty > 0) {
                hasItem = true;
                const info = itemsInfo[itemId];
                html += `
                  <div class="action-box" onclick="COMBAT.useItem('${itemId}')">
                    <span class="hotkey">${keyIdx}</span>
                    <div class="content">
                      <div class="act-name">[${qty}x] ${info.name}</div>
                      <div class="act-desc">${info.desc}</div>
                    </div>
                  </div>
                `;
                keyIdx++;
            }
        }
        if (!hasItem) {
            html += `<p style="color:#ff4444; font-family:monospace;">Inventaire vide. Utilisez le Piratage QCM.</p>`;
        }
        html += `
          <div class="action-box" onclick="COMBAT.combatMenuState='MAIN'; COMBAT.updateUI();">
            <span class="hotkey">0</span>
            <div class="content">
              <div class="act-name">Retour / Annuler</div>
              <div class="act-desc">Touche 0 ou Échap</div>
            </div>
          </div>
        `;
        menu.innerHTML = html;
        return;
    }

    // === SOUS-MENU FRAPPE CHARGÉE ===
    if (this.combatMenuState === 'CHARGED_STRIKE') {
        let html = `<div style="color:white; font-family:monospace; margin-bottom:10px; font-weight:bold;">SÉLECTIONNEZ LES PA À INVESTIR</div>`;
        const maxPa = this.playerEntity.pa || 0;
        if (maxPa < 1) {
            html += `<p style="color:#ff4444; font-family:monospace;">Pas assez de PA !</p>`;
        } else {
            for (let i = 1; i <= maxPa; i++) {
                if (i > 9) break; 
                html += `
                  <div class="action-box" onclick="COMBAT.executeChargedStrike(${i})">
                    <span class="hotkey">${i}</span>
                    <div class="content">
                      <div class="act-name">Puissance Niv. ${i}</div>
                      <div class="act-desc">Dégâts x ${(Math.pow(1.3, i)).toFixed(2)} (-${i} PA)</div>
                    </div>
                  </div>
                `;
            }
        }
        html += `
          <div class="action-box" onclick="COMBAT.combatMenuState='MAIN'; COMBAT.updateUI();">
            <span class="hotkey">0</span>
            <div class="content">
              <div class="act-name">Retour / Annuler</div>
              <div class="act-desc">Touche 0 ou Échap</div>
            </div>
          </div>
        `;
        menu.innerHTML = html;
        return;
    }

    // === MENU PRINCIPAL ===
    const cards = this.getAvailableAbilityCards();
    if (!this.selectedAbilityCardId || !cards.some((c) => c.id === this.selectedAbilityCardId)) {
      this.selectedAbilityCardId = cards[0]?.id || null;
    }
    menu.innerHTML = cards.map((card) => {
      const isCd = this.isAbilityOnCooldown(card.id);
      let costStr = card.paCost + " PA";
      if (card.id === "strike_charged") costStr = "Choix (Min 1)";
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

  useItem: function(itemId) {
      if (!this.playerEntity.inventory[itemId]) return;
      this.playerEntity.inventory[itemId]--;
      
      this.combatMenuState = 'MAIN';
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
          this.log("OBJET UTILISÉ : L'ennemi passera son prochain tour !");
      } else if (itemId === "data_shield") {
          this.playerEntity.shieldTurns = 2;
          this.log("OBJET UTILISÉ : Bouclier de Données activé ! (-50% dégâts reçus pendant 2 tours)");
      }

      this.updateUI();
      setTimeout(() => this.setTurn('PLAYER'), 800);
  },

  executeChargedStrike: function(paInvested) {
      if (this.playerEntity.pa < paInvested) return;
      this.combatMenuState = 'MAIN';
      this.setTurn('BUSY');
      
      this.playerEntity.pa -= paInvested;
      if (window.playerEntityObj) window.playerEntityObj.playAnim("atk2");
      
      const baseDmg = this.calcDamage(this.playerEntity, this.enemyEntity, { power: 15 });
      const dmg = Math.floor(baseDmg * Math.pow(1.3, paInvested));
      if (this.enemyEntity.applyDamage) this.enemyEntity.applyDamage(dmg); else this.enemyEntity.hp -= dmg;
      
      this.log("FRAPPE CHARGÉE (" + paInvested + " PA) : " + dmg + " DÉGÂTS DÉVASTATEURS !");
      
      this.updateUI();
      setTimeout(() => this.checkWinLoss('ENEMY'), 1100);
  },

  useAbilityCard: function(card) {
    if (this.turn !== 'PLAYER' || !card) return;
    if (!this.unlockedAbilityCards || !this.unlockedAbilityCards.has(card.id)) return;
    if (this.isAbilityOnCooldown(card.id)) return this.log(card.name + " est en cooldown.");
    
    if (card.id === "strike_charged") {
        if (this.playerEntity.pa < 1) return this.log("Pas assez de PA !");
        this.combatMenuState = 'CHARGED_STRIKE';
        this.updateUI();
        return;
    }
    
    if (card.id === "inventory") {
        this.combatMenuState = 'INVENTORY';
        this.updateUI();
        return;
    }

    let cost = card.paCost || 0;
    if ((this.playerEntity.pa || 0) < cost) return this.log("Pas assez de PA !");

    this.setTurn('BUSY');
    let endsTurn = true;

    if (window.playerEntityObj && card.animationKey && card.id !== "qcm") {
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
    else if (card.id === "qcm") {
      this.playerEntity.pa -= 2;
      endsTurn = false; 
      this.showQCM();
      return; 
    } 

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
    qcmDiv.style.width = "450px";
    qcmDiv.style.textAlign = "center";
    qcmDiv.style.fontFamily = "monospace";
    qcmDiv.style.boxShadow = "0 0 15px #00ffcc";

    const questions = [
        { q: "En réseau, que signifie le sigle DNS ?", options: ["Domain Name System", "Data Network Service", "Digital Node Server"], ans: 0 },
        { q: "Lequel de ces langages est fortement typé ?", options: ["JavaScript", "Python", "Rust"], ans: 2 },
        { q: "Qu'est-ce qu'une injection SQL ?", options: ["Une faille de base de données", "Un outil de requêtes rapide", "Une mise à jour système"], ans: 0 },
        { q: "En algorithmie, quelle est la complexité d'une recherche binaire ?", options: ["O(n)", "O(log n)", "O(n²)"], ans: 1 },
        { q: "Quel port par défaut est utilisé pour HTTPS ?", options: ["80", "443", "22"], ans: 1 },
        { q: "Qu'est-ce que le DOM en développement web ?", options: ["Document Object Model", "Data Oriented Module", "Digital Object Matrix"], ans: 0 },
        { q: "Quel pattern garantit une instance unique d'une classe ?", options: ["Factory", "Observer", "Singleton"], ans: 2 },
        { q: "Que signifie API ?", options: ["Application Programming Interface", "Advanced Protocol Integration", "Auto Processing Information"], ans: 0 }
    ];
    const q = questions[Math.floor(Math.random() * questions.length)];

    let html = `<h3>PIRATAGE SYSTÈME (QCM)</h3>
                <p style="color:#ff4444; font-size:12px; margin-bottom:15px;">ATTENTION: Une mauvaise réponse vous fera perdre votre tour ET vos 2 PA !</p>
                <p style="font-size:16px;">${q.q}</p>`;
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
        const loots = ["potion_50", "pa_battery", "stun_bomb", "data_shield"];
        const loot = loots[Math.floor(Math.random() * loots.length)];
        this.playerEntity.inventory[loot] = (this.playerEntity.inventory[loot] || 0) + 1;
        
        let lootName = loot === "potion_50" ? "Potion Soin 50%" : 
                       loot === "pa_battery" ? "Batterie (+4 PA)" : 
                       loot === "stun_bomb" ? "Grenade Stun" : "Bouclier de Données";
        this.log("Piratage RÉUSSI ! Vous obtenez : " + lootName);
        this.updateUI();
        this.setTurn('PLAYER'); // Garde la main
    } else {
        this.log("ÉCHEC CRITIQUE ! Piratage repoussé. FIN DU TOUR !");
        this.updateUI();
        this.setTurn('BUSY');
        setTimeout(() => this.checkWinLoss('ENEMY'), 1200); // Punition sévère
    }
  },

  handleInput: function(evt) {
    if (this.turn !== 'PLAYER') return;
    const key = (evt.key || "").trim();
    
    // Raccourcis pour faire RETOUR
    if (key === "0" || evt.key === "Escape" || evt.key === "Backspace") {
        if (this.combatMenuState !== 'MAIN') {
            this.combatMenuState = 'MAIN';
            this.updateUI();
        }
        return;
    }
    
    if (!/^\d$/.test(key)) return;
    const num = parseInt(key);

    if (this.combatMenuState === 'MAIN') {
        const card = this.getAvailableAbilityCards().find((c) => c.key === key);
        if (card) {
          this.selectedAbilityCardId = card.id;
          this.updateUI();
          this.useAbilityCard(card);
        }
    } 
    else if (this.combatMenuState === 'INVENTORY') {
        const itemsInfo = ["potion_50", "pa_battery", "stun_bomb", "data_shield"];
        let keyIdx = 1;
        let selectedItem = null;
        for (let itemId of itemsInfo) {
            const qty = this.playerEntity.inventory[itemId] || 0;
            if (qty > 0) {
                if (keyIdx === num) {
                    selectedItem = itemId;
                    break;
                }
                keyIdx++;
            }
        }
        if (selectedItem) this.useItem(selectedItem);
    } 
    else if (this.combatMenuState === 'CHARGED_STRIKE') {
        const maxPa = this.playerEntity.pa || 0;
        if (num >= 1 && num <= maxPa) {
            this.executeChargedStrike(num);
        }
    }
  },

  init: function(scene, camera, player, enemy) {
    this.active = true;
    this.combatMenuState = 'MAIN';
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
    this.playerEntity.inventory = { "potion_50": 1, "pa_battery": 1, "stun_bomb": 0, "data_shield": 0 };
    this.playerEntity.guarding = false;
    this.playerEntity.stunned = false;
    this.playerEntity.shieldTurns = 0;

    this.enemyEntity = new Entity({
        id: "boss1", name: "Alpha", hp: 2000, maxHp: 2000, maxPa: 10, pa: 2, atk: 40, def: 10
    });
    this.enemyEntity.inventory = { "potion_50": 2, "pa_battery": 0, "stun_bomb": 1, "data_shield": 1 };
    this.enemyEntity.guarding = false;
    this.enemyEntity.stunned = false;
    this.enemyEntity.shieldTurns = 0;

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
      });
    }

    document.body.classList.add("combat-mode");
    document.getElementById("hud").style.display = "none";
    document.getElementById("combatUI").style.display = "block";
    this.updateUI();
    this.log("COMBAT INITIÉ. SYSTÈME OPÉRATIONNEL.");

    setTimeout(() => this.setTurn('PLAYER'), 1500);
  },

  log: function(msg) { document.getElementById("cLog").textContent = msg; },

  updateUI: function() {
    if(!this.playerEntity) return;
    document.getElementById("cHpj").textContent = this.playerEntity.hp + " / " + this.playerEntity.maxHp + " (PA: " + this.playerEntity.pa + ")";
    
    let pjSt = [];
    if (this.playerEntity.guarding) pjSt.push("[GARDE]");
    if (this.playerEntity.shieldTurns > 0) pjSt.push(`[BOUCLIER: ${this.playerEntity.shieldTurns}T]`);
    document.getElementById("cMpj").textContent = pjSt.join(" "); 
    
    document.getElementById("cHpe").textContent = this.enemyEntity.hp + " / " + this.enemyEntity.maxHp + " (PA: " + this.enemyEntity.pa + ")";
    
    let totalItems = 0;
    for (let k in this.playerEntity.inventory) totalItems += this.playerEntity.inventory[k];
    const potEl = document.getElementById("cPot");
    if (potEl) potEl.textContent = totalItems;

    this.renderAbilityMenu();
  },

  setTurn: function(who) {
    this.turn = who;
    this.combatMenuState = 'MAIN'; // Toujours réinitialiser le menu
    
    if (who === 'PLAYER') {
      this.cameraFocusTurn = 'PLAYER';
      if (this.playerEntity.shieldTurns > 0) this.playerEntity.shieldTurns--;
      this.log("VOTRE TOUR. Choisissez une action.");
    } else if (who === 'ENEMY') {
      this.cameraFocusTurn = 'ENEMY';
      if (this.enemyEntity.shieldTurns > 0) this.enemyEntity.shieldTurns--;
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

    if (this.enemyEntity.hp < this.enemyEntity.maxHp * 0.4 && this.enemyEntity.inventory["potion_50"] > 0) {
        this.enemyEntity.inventory["potion_50"]--;
        const heal = Math.floor(this.enemyEntity.maxHp * 0.5);
        this.enemyEntity.hp = Math.min(this.enemyEntity.maxHp, this.enemyEntity.hp + heal);
        this.log("ALPHA UTILISE : Potion de Soin (+50% HP) !");
        this.updateUI();
        await new Promise(r => setTimeout(r, 1500));
    }

    if (this.playerEntity.pa >= 4 && this.enemyEntity.inventory["stun_bomb"] > 0) {
        this.enemyEntity.inventory["stun_bomb"]--;
        this.playerEntity.stunned = true;
        this.log("ALPHA UTILISE : Grenade Stun ! Vous serez paralysé !");
        this.updateUI();
        await new Promise(r => setTimeout(r, 1500));
    }

    // Le boss peut aussi utiliser son bouclier s'il se sent menacé
    if (this.playerEntity.pa >= 3 && this.enemyEntity.inventory["data_shield"] > 0 && this.enemyEntity.shieldTurns === 0) {
        this.enemyEntity.inventory["data_shield"]--;
        this.enemyEntity.shieldTurns = 2;
        this.log("ALPHA UTILISE : Bouclier de Données (-50% de dégâts pour 2 tours)");
        this.updateUI();
        await new Promise(r => setTimeout(r, 1500));
    }

    let actionType = "basic"; 

    if (this.enemyEntity.pa >= 3) {
        actionType = "charged"; 
    } else if (this.enemyEntity.pa < 2) {
        actionType = Math.random() > 0.5 ? "guard" : "basic"; 
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

  endCombat: function() {"""

text = text[:start_idx] + new_combat_code + text[end_func_idx + len("endCombat: function() {"):]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Patch v2 applied successfully!")

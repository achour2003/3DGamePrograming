import sys

filepath = "override_campus_zero (2).html"

with open(filepath, 'rb') as f:
    content = f.read()

text = content.decode('utf-8')

# 1. Define GAME_PROGRESSION and BOSS_ROSTER
progression_code = """
// ─── BOSS RUSH PROGRESSION ───────────
window.GAME_PROGRESSION = {
    currentBossIndex: 0,
    playerInventory: { "potion_50": 1, "pa_battery": 1, "stun_bomb": 0, "data_shield": 0 }
};

window.BOSS_ROSTER = [
    {
        id: "alpha", name: "ALPHA (Le Gardien)", hp: 1500, maxHp: 1500, pa: 2, maxPa: 10, atk: 25, def: 10,
        inventory: { "potion_50": 1, "pa_battery": 0, "stun_bomb": 0, "data_shield": 0 },
        drop: "potion_50", dropName: "Potion de Soin (50%)",
        color: new BABYLON.Color3(1, 0.2, 0.2), // Rouge
        scale: 1.5,
        spawnPos: new BABYLON.Vector3(0, 1.5, -15)
    },
    {
        id: "beta", name: "BETA (Le Tank Cuirassé)", hp: 3500, maxHp: 3500, pa: 2, maxPa: 10, atk: 15, def: 30,
        inventory: { "potion_50": 1, "pa_battery": 0, "stun_bomb": 0, "data_shield": 1 },
        drop: "data_shield", dropName: "Bouclier de Données",
        color: new BABYLON.Color3(0.2, 0.2, 1), // Bleu
        scale: 2.0,
        spawnPos: new BABYLON.Vector3(15, 2.0, -15)
    },
    {
        id: "gamma", name: "GAMMA (L'Assassin)", hp: 1200, maxHp: 1200, pa: 2, maxPa: 10, atk: 60, def: 0,
        inventory: { "potion_50": 0, "pa_battery": 0, "stun_bomb": 1, "data_shield": 0 },
        drop: "stun_bomb", dropName: "Grenade Stun",
        color: new BABYLON.Color3(0.2, 1, 0.2), // Vert
        scale: 1.2,
        spawnPos: new BABYLON.Vector3(-15, 1.2, -15)
    },
    {
        id: "omega", name: "OMEGA (Le Maître)", hp: 4000, maxHp: 4000, pa: 4, maxPa: 10, atk: 45, def: 20,
        inventory: { "potion_50": 3, "pa_battery": 1, "stun_bomb": 2, "data_shield": 2 },
        drop: "win", dropName: "FIN DU JEU",
        color: new BABYLON.Color3(1, 0.8, 0), // Doré
        scale: 2.5,
        spawnPos: new BABYLON.Vector3(0, 2.5, 20)
    }
];

window.spawnActiveBoss = function(scene) {
    if (scene.activeBoss) {
        scene.activeBoss.dispose();
    }
    
    if (GAME_PROGRESSION.currentBossIndex >= BOSS_ROSTER.length) {
        return; // Victoire totale
    }
    
    const bossConfig = BOSS_ROSTER[GAME_PROGRESSION.currentBossIndex];
    const enemy = BABYLON.MeshBuilder.CreateBox("enemyObj_" + bossConfig.id, {size: bossConfig.scale}, scene);
    enemy.position.copyFrom(bossConfig.spawnPos);
    
    const mEnemy = new BABYLON.StandardMaterial("mEnemy_" + bossConfig.id, scene);
    mEnemy.diffuseColor = bossConfig.color;
    mEnemy.emissiveColor = bossConfig.color.scale(0.6);
    enemy.material = mEnemy;
    
    let alpha = 0;
    scene.registerBeforeRender(() => {
        if(enemy.isDisposed()) return;
        alpha += 0.05;
        enemy.position.y = bossConfig.spawnPos.y + Math.sin(alpha) * 0.2;
        enemy.rotation.y += 0.02;
    });
    
    scene.activeBoss = enemy;
};
"""

# Insert progression code right before const COMBAT
if progression_code not in text:
    text = text.replace("const COMBAT = {", progression_code + "\nconst COMBAT = {")

# 2. Modify COMBAT.init to load from GAME_PROGRESSION and BOSS_ROSTER
old_init = """    this.playerEntity = new Entity({
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
    this.enemyEntity.shieldTurns = 0;"""

new_init = """    // Restaurer HP et PA max selon la consigne
    this.playerEntity = new Entity({
        id: "hero1", name: "Player", hp: 1000, maxHp: 1000, maxPa: 10, pa: 2, atk: 30, def: 5
    });
    this.playerEntity.inventory = window.GAME_PROGRESSION.playerInventory; // Use persistent inventory
    this.playerEntity.guarding = false;
    this.playerEntity.stunned = false;
    this.playerEntity.shieldTurns = 0;

    const bossCfg = window.BOSS_ROSTER[window.GAME_PROGRESSION.currentBossIndex];
    this.enemyEntity = new Entity({
        id: bossCfg.id, name: bossCfg.name, hp: bossCfg.hp, maxHp: bossCfg.maxHp, maxPa: bossCfg.maxPa, pa: bossCfg.pa, atk: bossCfg.atk, def: bossCfg.def
    });
    // Clone the inventory so we don't modify the static definition
    this.enemyEntity.inventory = JSON.parse(JSON.stringify(bossCfg.inventory)); 
    this.enemyEntity.guarding = false;
    this.enemyEntity.stunned = false;
    this.enemyEntity.shieldTurns = 0;"""

text = text.replace(old_init, new_init)

# 3. Modify COMBAT.checkWinLoss to handle progression
old_winloss = """      if (this.enemyEntity.hp <= 0) {
        this.log("VICTOIRE ! ENTITÉ DÉTRUITE.");
        if (this.enemyMesh && !this.enemyMesh.isDisposed()) {
            this.enemyMesh.dispose();
        }
        setTimeout(() => this.endCombat(), 2000);"""

new_winloss = """      if (this.enemyEntity.hp <= 0) {
        const bossCfg = window.BOSS_ROSTER[window.GAME_PROGRESSION.currentBossIndex];
        
        if (bossCfg.drop === "win") {
             this.log("VICTOIRE TOTALE ! VOUS AVEZ FINI LE JEU !");
             setTimeout(() => { alert("Félicitations, vous avez vaincu OMEGA !"); location.reload(); }, 3000);
             return;
        }

        // Add loot to persistent inventory
        window.GAME_PROGRESSION.playerInventory[bossCfg.drop] = (window.GAME_PROGRESSION.playerInventory[bossCfg.drop] || 0) + 1;
        this.log("VICTOIRE ! BUTIN OBTENU : " + bossCfg.dropName);
        
        // Progression
        window.GAME_PROGRESSION.currentBossIndex++;

        if (this.enemyMesh && !this.enemyMesh.isDisposed()) {
            this.enemyMesh.dispose();
        }
        setTimeout(() => {
            if (this.scene) {
                window.spawnActiveBoss(this.scene);
            }
            this.endCombat();
        }, 2000);"""

text = text.replace(old_winloss, new_winloss)

# 4. Modify COMBAT.enemyAI logic for specific bosses
old_ai = """    if (actionType === "guard") {
        this.enemyEntity.pa += 3;
        this.enemyEntity.guarding = true;
        this.log("ALPHA UTILISE : Posture Défensive (+3 PA) !");
    } else if (actionType === "basic") {
        this.enemyEntity.pa += 1;
        const dmg = this.calcDamage(this.enemyEntity, this.playerEntity, { power: 15 });
        if (this.playerEntity.applyDamage) this.playerEntity.applyDamage(dmg); else this.playerEntity.hp -= dmg;
        this.log("ALPHA UTILISE : Frappe Basique (" + dmg + " dégâts, +1 PA)");
    } else if (actionType === "charged") {"""

new_ai = """    // IA Spécifique selon le boss
    if (this.enemyEntity.id === "gamma") {
        actionType = "basic"; // Assassin ne garde jamais
        if (this.enemyEntity.pa >= 3) actionType = "charged";
    } else if (this.enemyEntity.id === "beta") {
        if (this.enemyEntity.pa < 3) actionType = Math.random() > 0.3 ? "guard" : "basic"; // Tank garde souvent
    }

    let bossName = this.enemyEntity.name.split(" ")[0]; // ALPHA, BETA...

    if (actionType === "guard") {
        this.enemyEntity.pa += 3;
        this.enemyEntity.guarding = true;
        this.log(bossName + " UTILISE : Posture Défensive (+3 PA) !");
    } else if (actionType === "basic") {
        this.enemyEntity.pa += 1;
        const dmg = this.calcDamage(this.enemyEntity, this.playerEntity, { power: 15 });
        if (this.playerEntity.applyDamage) this.playerEntity.applyDamage(dmg); else this.playerEntity.hp -= dmg;
        this.log(bossName + " UTILISE : Frappe Basique (" + dmg + " dégâts, +1 PA)");
    } else if (actionType === "charged") {"""

text = text.replace(old_ai, new_ai)

# fix old_ai prints in specific instances
text = text.replace('this.log("ALPHA UTILISE : Frappe Chargée', 'this.log(bossName + " UTILISE : Frappe Chargée')
text = text.replace('this.log("ALPHA UTILISE : Bouclier de Données', 'this.log(bossName + " UTILISE : Bouclier de Données')
text = text.replace('this.log("ALPHA UTILISE : Potion de Soin', 'this.log(bossName + " UTILISE : Potion de Soin')
text = text.replace('this.log("ALPHA UTILISE : Grenade Stun', 'this.log(bossName + " UTILISE : Grenade Stun')
text = text.replace('this.log("L\'Entité Alpha réfléchit...', 'this.log(this.enemyEntity.name + " réfléchit...')
text = text.replace('this.log("L\'Entité Alpha est PARALYSÉE', 'this.log(this.enemyEntity.name + " est PARALYSÉE')

# 5. Remove original hardcoded enemy spawn and replace with spawnActiveBoss call
old_spawn = """  // â• â•  ENNEMI (EntitÃ© Alpha) â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• 
  const enemy = BABYLON.MeshBuilder.CreateBox("enemyObj", {size: 1.5}, scene);
  enemy.position.set(0, 1.5, -15); // PlacÃ© devant le joueur au dÃ©marrage
  const mEnemy = new BABYLON.StandardMaterial("mEnemy", scene);
  mEnemy.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1);
  mEnemy.emissiveColor = new BABYLON.Color3(0.5, 0.0, 0.0);
  enemy.material = mEnemy;
  
  // Animation de flottaison simple
  let alpha = 0;
  scene.registerBeforeRender(() => {
    alpha += 0.05;
    enemy.position.y = 1.5 + Math.sin(alpha) * 0.2;
    enemy.rotation.y += 0.02;
  });
  
  // On le stocke globalement pour le dÃ©tecter
  scene.enemyAlpha = enemy;"""

import re
# Use regex to find and replace the spawn block since encoding chars might be messy
# It's inside createProceduralLevel. Let's just find the function call "createProceduralLevel" and replace scene.enemyAlpha detection.
# Actually, the python replace above might fail if the unicode characters don't match.

# Replace detection loop:
text = text.replace("if (scene.enemyAlpha && !scene.enemyAlpha.isDisposed()) {", "if (scene.activeBoss && !scene.activeBoss.isDisposed()) {")
text = text.replace("const dist = BABYLON.Vector3.Distance(player.mesh.position, scene.enemyAlpha.position);", "const dist = BABYLON.Vector3.Distance(player.mesh.position, scene.activeBoss.position);")
text = text.replace("COMBAT.init(scene, camera, player, scene.enemyAlpha);", "COMBAT.init(scene, camera, player, scene.activeBoss);")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Patch Boss Rush Step 1 ready.")

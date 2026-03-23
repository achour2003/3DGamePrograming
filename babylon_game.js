const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = async function () {
    const scene = new BABYLON.Scene(engine);

    // Camera
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 10, new BABYLON.Vector3(0, 1, 0), scene);
    camera.attachControl(canvas, true);

    // Lumière
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.position = new BABYLON.Vector3(20, 40, 20);

    // Environnement basique
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 100, height: 100}, scene);
    
    // Charger le personnage (mesh principal)
    const result = await BABYLON.SceneLoader.ImportMeshAsync("", "mannequins/", "SKM_Manny_Simple.glb", scene);
    const hero = result.meshes[0];
    hero.scaling = new BABYLON.Vector3(1, 1, 1);
    
    // --- CLONAGE DE L'ENNEMI (Boss = Cube Rouge) ---
    const boss = BABYLON.MeshBuilder.CreateBox("boss", {size: 3}, scene);
    boss.position = new BABYLON.Vector3(0, 1.5, 8); // On le place devant le joueur

    // Création d'un Material spécifique pour le boss
    const bossMaterial = new BABYLON.StandardMaterial("bossMat", scene);
    bossMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // Cube Rouge
    bossMaterial.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
    boss.material = bossMaterial;
    // ------------------------------------

    // --- Stats du Joueur ---
    // On multiplie par 10 les points de vie (ex: 100 * 10 = 1000)
    // On multiplie par 2 la capacité de frappe (ex: 15 * 2 = 30)
    const playerStats = {
        hp: 1000,
        maxHp: 1000,
        attack: 30
    };

    // --- Stats de l'Ennemi ---
    // On multiplie par 12 les points de vie (ex: 120 * 12 = 1440)
    // On multiplie par 2.5 la force de frappe (ex: 15 * 2.5 = 37.5)
    const enemyStats = {
        hp: 1440,
        maxHp: 1440,
        attack: 37.5
    };
    
    // On garde une trace de l'animation courante
    let currentAnimation = null;
    let animGroupsObj = {};

    let bossState = "idle";
    let bossAnimTime = 0;
    const bossStartPos = new BABYLON.Vector3(0, 1.5, 8); // Position d'origine du boss

    // Fonction pour charger et lier une animation à un mesh donné
    async function loadAnimation(folder, file, keyName, targetNode, animDict, isLooping = true) {
        try {
            const animResult = await BABYLON.SceneLoader.LoadAssetContainerAsync(folder, file, scene);
            if (animResult.animationGroups.length > 0) {
                const animGroup = animResult.animationGroups[0];
                animGroup.targetedAnimations.forEach(ta => {
                    const originalNode = ta.target;
                    if(originalNode && originalNode.name) {
                        // Chercher le noeud correspondant dans le hierarchy du targetNode
                        const actualNode = targetNode.getChildTransformNodes(false).find(n => n.name === originalNode.name) 
                                           || targetNode.getChildMeshes(false).find(m => m.name === originalNode.name);
                        
                        if (actualNode) {
                            ta.target = actualNode;
                        } else if (originalNode.name === targetNode.name || originalNode.name === "SKM_Manny_Simple") {
                            // Parfois la racine elle-même
                            ta.target = targetNode;
                        }
                    }
                });
                
                // Activer le blending pour des transitions fluides
                animGroup.enableBlending = true;
                animGroup.blendingSpeed = 0.05;
                
                scene.animationGroups.push(animGroup);
                animGroup.stop();
                animDict[keyName] = { group: animGroup, looping: isLooping };
            }
        } catch (e) {
            console.error("Erreur avec " + file, e);
        }
    }

    // Charger les animations de Jog pour le héros
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Fwd.glb", "jog_z", hero, animGroupsObj);
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Bwd.glb", "jog_s", hero, animGroupsObj);
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Left.glb", "jog_q", hero, animGroupsObj);
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Right.glb", "jog_d", hero, animGroupsObj);
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Fwd_Left.glb", "jog_zq", hero, animGroupsObj);
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Fwd_Right.glb", "jog_zd", hero, animGroupsObj);
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Bwd_Left.glb", "jog_sq", hero, animGroupsObj);
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Bwd_Right.glb", "jog_sd", hero, animGroupsObj);
    
    // Charger les animations de marche pour le héros
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Fwd.glb", "walk_z", hero, animGroupsObj);
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Bwd.glb", "walk_s", hero, animGroupsObj);
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Left.glb", "walk_q", hero, animGroupsObj);
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Right.glb", "walk_d", hero, animGroupsObj);
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Fwd_Left.glb", "walk_zq", hero, animGroupsObj);
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Fwd_Right.glb", "walk_zd", hero, animGroupsObj);
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Bwd_Left.glb", "walk_sq", hero, animGroupsObj);
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Bwd_Right.glb", "walk_sd", hero, animGroupsObj);

    // Charger les animations de saut (Jump) pour le héros
    await loadAnimation("annim/jump/", "MM_Jump.glb", "jump", hero, animGroupsObj, false);
    await loadAnimation("annim/jump/", "MM_Fall_Loop.glb", "fall", hero, animGroupsObj, true);
    await loadAnimation("annim/jump/", "MM_Land.glb", "land", hero, animGroupsObj, false);


    let isMoving = false;
    let inputMap = {};
    let isJumping = false;
    let isLanding = false;

        // ===== NOUVEAU: Système de cartes d'aptitudes (RPG / role-based) =====
        const abilityCards = [
            {
                id: "strike_basic",
                name: "Frappe Basique",
                description: "Une attaque simple au corps a corps.",
                key: "1",
                animationKey: "jog_z",
                unlocks: ["strike_heavy"],
            },
            {
                id: "guard",
                name: "Garde Defensive",
                description: "Reduit les degats pendant un court instant.",
                key: "2",
                animationKey: "walk_s",
                unlocks: [],
            },
            {
                id: "battle_cry",
                name: "Cri de Bataille",
                description: "Boost temporaire qui debloque une nouvelle frappe.",
                key: "3",
                animationKey: "jump",
                unlocks: ["inspired_strike"],
            },
            // Cartes de suivi debloquees en jeu (vous remplacerez animationKey plus tard)
            {
                id: "strike_heavy",
                name: "Frappe Lourde",
                description: "Une frappe plus lente et puissante.",
                key: "4",
                animationKey: "jog_s",
                unlocks: [],
            },
            {
                id: "inspired_strike",
                name: "Frappe Inspiree",
                description: "Une frappe speciale apres un cri de bataille.",
                key: "5",
                animationKey: "walk_z",
                unlocks: [],
            },
        ];

        const availableAbilityCardIds = new Set(["strike_basic", "guard", "battle_cry"]);
        const abilityCooldownMap = new Map();
        const ABILITY_COOLDOWN_MS = 1200;
        const ABILITY_ANIMATION_LOCK_MS = 450;
        let abilityAnimationLockUntil = 0;

        function isAbilityOnCooldown(cardId) {
            const until = abilityCooldownMap.get(cardId) || 0;
            return Date.now() < until;
        }

        function getCardById(cardId) {
            return abilityCards.find((c) => c.id === cardId) || null;
        }

        function getAvailableCards() {
            return Array.from(availableAbilityCardIds)
                .map((id) => getCardById(id))
                .filter(Boolean)
                .sort((a, b) => a.key.localeCompare(b.key));
        }

        // ===== NOUVEAU: UI overlay minimale des cartes disponibles =====
        const abilitiesUI = document.createElement("div");
        abilitiesUI.id = "abilityCardsOverlay";
        abilitiesUI.style.position = "fixed";
        abilitiesUI.style.right = "16px";
        abilitiesUI.style.bottom = "16px";
        abilitiesUI.style.zIndex = "1000";
        abilitiesUI.style.padding = "10px 12px";
        abilitiesUI.style.background = "rgba(0,0,0,0.45)";
        abilitiesUI.style.color = "#ffffff";
        abilitiesUI.style.fontFamily = "monospace";
        abilitiesUI.style.fontSize = "12px";
        abilitiesUI.style.lineHeight = "1.6";
        abilitiesUI.style.pointerEvents = "none";
        document.body.appendChild(abilitiesUI);

        function updateAbilitiesUI() {
            const lines = getAvailableCards().map((card) => {
                const cooldownTag = isAbilityOnCooldown(card.id) ? " (cooldown)" : "";
                return card.key + " - " + card.name + cooldownTag;
            });
            abilitiesUI.textContent = lines.join("\n") || "Aucune carte disponible";
            abilitiesUI.style.whiteSpace = "pre-line";
        }

        // ===== NOUVEAU: Utilisation d'une carte =====
        function useAbilityCard(card) {
            if (!card) return;
            if (!availableAbilityCardIds.has(card.id)) return;
            if (isAbilityOnCooldown(card.id)) return;

            if (animGroupsObj[card.animationKey]) {
                playAnimation(card.animationKey);
                abilityAnimationLockUntil = Date.now() + ABILITY_ANIMATION_LOCK_MS;
            } else {
                console.warn("Animation de carte introuvable:", card.animationKey);
            }

            abilityCooldownMap.set(card.id, Date.now() + ABILITY_COOLDOWN_MS);
            setTimeout(() => {
                updateAbilitiesUI();
            }, ABILITY_COOLDOWN_MS + 20);

            card.unlocks.forEach((unlockId) => {
                if (!availableAbilityCardIds.has(unlockId) && getCardById(unlockId)) {
                    availableAbilityCardIds.add(unlockId);
                }
            });

            updateAbilitiesUI();
        }

        function handleAbilityKeyPress(key) {
            const card = getAvailableCards().find((c) => c.key === key);
            if (card) {
                useAbilityCard(card);
            }
        }

        updateAbilitiesUI();

    window.addEventListener("keydown", (evt) => {
        let key = evt.key.toLowerCase();
        if(key === " ") key = "space";
        if(evt.shiftKey) inputMap["shift"] = true;
        inputMap[key] = true;

        // ===== NOUVEAU: Input des cartes (1,2,3...) =====
        if (!evt.repeat && /^[0-9]$/.test(key)) {
            handleAbilityKeyPress(key);
        }
    });

    window.addEventListener("keyup", (evt) => {
        let key = evt.key.toLowerCase();
        if(key === " ") key = "space";
        if(!evt.shiftKey) inputMap["shift"] = false;
        inputMap[key] = false;
    });

    const moveSpeedJog = 4.0;
    const moveSpeedWalk = 2.0;

    // Vitesse de transition pour le saut
    let verticalVelocity = 0;
    const gravity = -9.81 * 1.5;

    let bossState = "idle";
    
    // Fonction pour jouer l'animation du héros
    function playAnimation(animKey) {
        let animObj = animGroupsObj[animKey];
        if (!animObj || currentAnimation === animObj.group) return;
        
        if (currentAnimation) {
            currentAnimation.stop();
        }
        currentAnimation = animObj.group;
        currentAnimation.play(animObj.looping);
    }

    // --- Phase 3 : AI & Feintes avec Procedural Animations (Cube Boss) ---
    // (Le boss est un cube, il ne peut pas utiliser de groupes d'animation glb. On anime ses positions)
    
    // Fonction qui lance l'animation d'attaque (le cube fonce sur le joueur)
    function animateCubeAttack(isFeint = false) {
        // Enregistre l'ancienne position
        const targetPos = hero.position.clone(); // Le boss vise le joueur
        targetPos.y = 1.5; // On garde la hauteur du boss
        
        // S'il feinte, il ne va qu'à un tiers du chemin et plus lentement
        const dashTarget = isFeint ? BABYLON.Vector3.Lerp(bossStartPos, targetPos, 0.3) : targetPos;
        const speed = isFeint ? 15 : 45; // Très rapide si vraie attaque
        
        // Animation du Dash Aller
        BABYLON.Animation.CreateAndStartAnimation("bossDash", boss, "position", 60, speed, boss.position, dashTarget, 0, new BABYLON.SineEase(), () => {
            if (isFeint) {
                // Dès qu'il a feinté, il revient à sa place
                BABYLON.Animation.CreateAndStartAnimation("bossReturn", boss, "position", 60, 20, boss.position, bossStartPos, 0, new BABYLON.SineEase());
            } else {
                // Impact ! Il recule doucement
                BABYLON.Animation.CreateAndStartAnimation("bossReturn", boss, "position", 60, 15, boss.position, bossStartPos, 0, new BABYLON.SineEase());
            }
        });
    }

    function triggerBossAttackCycle() {
        if (bossState !== "idle") return;

        // Délai de réflexion / attente aléatoire (entre 0.5s et 2.5s)
        const waitTime = 500 + Math.random() * 2000;
        
        setTimeout(() => {
            // L'IA lit les PA du joueur comme exigé dans le Game Design
            console.log(`[L'IA Doyenne] Analyse la cible... Le joueur a ${playerPaAmount} PA.`);
            
            // Probabilité de feinte (30% de chance)
            const isBait = Math.random() < 0.3;

            if (isBait) {
                bossState = "feinting";
                animateCubeAttack(true); // Fait un dash partiel
                
                // On annule la feinte au bout de 0.3s et on repart
                setTimeout(() => {
                    bossState = "idle";
                    
                    // Après une petite pause, lance la vraie attaque
                    setTimeout(() => {
                        executeRealAttack();
                    }, 500);

                }, 300);

            } else {
                executeRealAttack();
            }

        }, waitTime);
    }

    // --- Phase 4 : Système Temps Réel (Parry/Parade) ---
    let isParryWindowOpen = false;
    let parryResultGiven = false; 
    let attackDamageBase = 120; // Dégâts fictifs de l'attaque du Boss
    let playerPaAmount = 0; // Les PA démarrent à 0

    // UI Globale du joueur (Affichage des PA et indications de Parade)
    const playerUI = document.createElement("div");
    playerUI.style.position = "absolute";
    playerUI.style.bottom = "20px";
    playerUI.style.left = "20px";
    playerUI.style.color = "white";
    playerUI.style.fontFamily = "monospace";
    playerUI.style.fontSize = "24px";
    playerUI.style.textShadow = "2px 2px 0 #000";
    playerUI.style.pointerEvents = "none";
    playerUI.style.zIndex = "10";
    playerUI.innerHTML = `
        <div>Joueur HP: 1000/1000</div>
        <div>Joueur PA: <span id="ui_pa_amount" style="color:cyan;">0</span> / 6 (Max)</div>
        <div style="font-size: 16px; margin-top: 10px; color: #88ff88;">[F] Attaque de base (+1 PA) | [E] Parade (pendant le rouge) | [H] Hack QCM</div>
    `;
    document.body.appendChild(playerUI);

    const updatePaUI = () => {
        const paSpan = document.getElementById("ui_pa_amount");
        if(paSpan) paSpan.innerText = playerPaAmount;
    };

    // Création d'un élément visuel (HTML) superposé au Canvas pour aider le joueur au Parry
    const parryUI = document.createElement("div");
    parryUI.style.position = "absolute";
    parryUI.style.top = "40%";
    parryUI.style.left = "50%";
    parryUI.style.transform = "translate(-50%, -50%)";
    parryUI.style.fontSize = "50px";
    parryUI.style.fontWeight = "bold";
    parryUI.style.color = "yellow";
    parryUI.style.pointerEvents = "none";
    parryUI.style.textShadow = "0 0 10px black";
    parryUI.style.display = "none";
    document.body.appendChild(parryUI);

    // Fonction d'écoute globale du Parry (Touche 'A' ou Clique droit par exemple, ici touche 'e')
    window.addEventListener("keydown", (evt) => {
        // [F] - Basic Attack : Coûte 0 PA, Rapporte 1 PA
        if (evt.key.toLowerCase() === "f") {
            playAnimation("attack");
            playerPaAmount = Math.min(6, playerPaAmount + 1); // Clamp à 6 (+1 PA sur attaque de base)
            updatePaUI();
            console.log(`[Combat] Hit direct ! Vous frappez le boss. PA actuels : ${playerPaAmount}`);
        }

        if (evt.key.toLowerCase() === "e") { // E pour Parer
            if (bossState === "attacking" && !parryResultGiven) {
                if (isParryWindowOpen) {
                    // PARADE PARFAITE !
                    parryResultGiven = true;
                    playerPaAmount = Math.min(6, playerPaAmount + 1); // +1 PA !
                    updatePaUI();
                    
                    parryUI.innerText = "PERFECT PARRY! (+1 PA)";
                    parryUI.style.color = "cyan";
                    parryUI.style.display = "block";
                    
                    console.log(`%c[COMBAT] Parade Parfaite ! Dégâts annulés. PA du joueur : ${playerPaAmount}/6`, "color:cyan");
                    
                    // FX visuel temporaire (facultatif)
                    setTimeout(() => { parryUI.style.display = "none"; }, 1000);
                } else {
                    // PARRY RATÉ OU TROP TÔT
                    parryResultGiven = true; // Empêche de spammer la touche pour avoir le perfect
                    
                    parryUI.innerText = "MISSED!";
                    parryUI.style.color = "gray";
                    parryUI.style.display = "block";
                    
                    console.log(`%c[COMBAT] Parade ratée (Dégâts : ${attackDamageBase})`, "color:red");
                    
                    setTimeout(() => { parryUI.style.display = "none"; }, 800);
                }
            }
        }
    });

    function executeRealAttack() {
        bossState = "attacking";
        parryResultGiven = false;
        
        // 1. Telegraph (L'attaque arrive !) => Le cube devient jaune vif
        boss.material.emissiveColor = new BABYLON.Color3(1, 1, 0); 
        console.log("[Telegraph] Le boss prépare une attaque !");
        
        // La frame de dégâts se situe (arbitrairement) à environ 0.5s.
        // On ouvre la fenêtre de Parry (0.3s) juste avant cet impact
        
        setTimeout(() => {
            if (bossState === "attacking") {
                isParryWindowOpen = true; // Ouvre la fenêtre d'invulnérabilité
                
                // Indice visuel / Auditif flash
                parryUI.innerText = "!";
                parryUI.style.color = "yellow";
                parryUI.style.display = "block";
                boss.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
                animateCubeAttack(false); // dash

                // Ferme la fenêtre au bout de 0.3 secondes
                setTimeout(() => {
                    isParryWindowOpen = false;
                    parryUI.style.display = "none";
                    boss.material.emissiveColor = new BABYLON.Color3(0, 0, 0); // revient couleur
                    
                    if (!parryResultGiven) {
                        // Le joueur n'a ABSOLUMENT pas appuyé. Sanction Totale.
                        console.log(`%c[COMBAT] Dégâts totaux subis : ${attackDamageBase} HP`, "color:red");
                        
                        parryUI.innerText = "HIT!";
                        parryUI.style.color = "red";
                        parryUI.style.display = "block";
                        setTimeout(() => { parryUI.style.display = "none"; }, 800);
                    }
                }, 300); // Durée parfaite : 0.3s
            }
        }, 500); // Temps avant l'impact du coup
        
        // Attendre la fin de l'animation d'attaque complète pour remettre l'Idle
        setTimeout(() => {
            bossState = "idle";
            triggerBossAttackCycle(); 
        }, 1500); 
    }

    // Lancer la boucle de combat du boss (pour la démo visuelle)
    setTimeout(triggerBossAttackCycle, 3000);
    // --------------------------------------------------

    // --- Phase 5 : Système de Hack (QCM) ---
    let qcmUsesLeft = 2;
    let isQcmActive = false;
    let combatInventory = []; // Inventaire temporaire

    // Création de l'interface DOM pour le QCM
    const qcmOverlay = document.createElement("div");
    qcmOverlay.style.position = "absolute";
    qcmOverlay.style.top = "0";
    qcmOverlay.style.left = "0";
    qcmOverlay.style.width = "100%";
    qcmOverlay.style.height = "100%";
    qcmOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    qcmOverlay.style.color = "#00ff00";
    qcmOverlay.style.fontFamily = "monospace";
    qcmOverlay.style.display = "none";
    qcmOverlay.style.flexDirection = "column";
    qcmOverlay.style.justifyContent = "center";
    qcmOverlay.style.alignItems = "center";
    qcmOverlay.style.zIndex = "1000";
    qcmOverlay.innerHTML = `
        <h1 style="margin-bottom: 30px; border-bottom: 2px solid #00ff00; padding-bottom: 10px;">> HACKING INTERFACE_</h1>
        <div id="qcmQuestion" style="font-size: 24px; margin-bottom: 40px; text-align: center; max-width: 80%;">Loading...</div>
        <div id="qcmTimer" style="font-size: 30px; font-weight: bold; color: yellow; margin-bottom: 30px;">15.0s</div>
        <div id="qcmAnswers" style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;"></div>
    `;
    document.body.appendChild(qcmOverlay);

    // Une base de questions de Test
    const questionsDB = [
        { q: "Quelle est la limite stricte de PA configurée dans l'entité de notre monde binaire ?", a: ["10 PA", "6 PA", "5 PA", "Aucune"], cor: 1 },
        { q: "Quel est le nom de l'attaque surchargée de l'IA Doyenne ?", a: ["Blâme Académique", "Buffer Overflow", "Exclusion Définitive", "Surcharge"], cor: 2 },
        { q: "Si Kaleb dispose de 2 PA, quel sera le multiplicateur de dégâts de son arme chargée ?", a: ["1.3x", "2.0x", "1.69x", "1.0x"], cor: 0 }
    ];

    let qcmInterval;
    function triggerQCM() {
        if (qcmUsesLeft <= 0 || bossState !== "idle") {
            console.log("QCM inaccessible (Action en cours ou max atteint)");
            return;
        }

        isQcmActive = true;
        qcmUsesLeft--;
        
        // Fausse pause de l'Animation (pour ne pas stopper complètement Babylon, on arrête le Boss)
        if (bossCurrentAnimation) bossCurrentAnimation.pause();
        if (currentAnimation) currentAnimation.pause();

        qcmOverlay.style.display = "flex";

        // Sélectionner une question
        const qObj = questionsDB[Math.floor(Math.random() * questionsDB.length)];
        document.getElementById("qcmQuestion").innerText = qObj.q;

        const answersDiv = document.getElementById("qcmAnswers");
        answersDiv.innerHTML = "";
        
        qObj.a.forEach((ansText, index) => {
            const btn = document.createElement("button");
            btn.innerText = `[${index}] ${ansText}`;
            btn.style.padding = "15px 30px";
            btn.style.fontSize = "18px";
            btn.style.backgroundColor = "transparent";
            btn.style.border = "1px solid #00ff00";
            btn.style.color = "#00ff00";
            btn.style.cursor = "pointer";
            btn.style.transition = "background 0.2s";
            
            btn.onmouseover = () => btn.style.backgroundColor = "rgba(0, 255, 0, 0.2)";
            btn.onmouseout = () => btn.style.backgroundColor = "transparent";
            
            btn.onclick = () => resolveQCM(index === qObj.cor);
            answersDiv.appendChild(btn);
        });

        // Timer
        let timeLeft = 15.0;
        document.getElementById("qcmTimer").innerText = timeLeft.toFixed(1) + "s";
        
        qcmInterval = setInterval(() => {
            timeLeft -= 0.1;
            document.getElementById("qcmTimer").innerText = timeLeft.toFixed(1) + "s";
            if (timeLeft <= 0) {
                resolveQCM(false); // Temps écoulé = Échec
            }
        }, 100);
    }

    function resolveQCM(isSuccess) {
        clearInterval(qcmInterval);
        
        if (isSuccess) {
            document.getElementById("qcmQuestion").innerText = "ACCESS GRANTED. Injecting payload...";
            document.getElementById("qcmQuestion").style.color = "cyan";
            document.getElementById("qcmTimer").innerText = "SUCCESS";
            document.getElementById("qcmTimer").style.color = "cyan";
            
            // Gain de l'objet (aléatoire entre HEALTH et DOUBLE_THREAD)
            const itemGained = Math.random() > 0.5 ? "HEALTH.exe" : "Double_Thread.exe";
            combatInventory.push(itemGained);
            console.log(`%c[INVENTAIRE] Objet ajouté : ${itemGained}`, "color:magenta; font-weight:bold");
            
        } else {
            document.getElementById("qcmQuestion").innerText = "ACCESS DENIED.";
            document.getElementById("qcmQuestion").style.color = "red";
            document.getElementById("qcmTimer").innerText = "FAILED";
            document.getElementById("qcmTimer").style.color = "red";
        }
        
        document.getElementById("qcmAnswers").innerHTML = "";

        setTimeout(() => {
            qcmOverlay.style.display = "none";
            isQcmActive = false;
            
            // Resume des animations
            if (bossCurrentAnimation) bossCurrentAnimation.play();
            if (currentAnimation) currentAnimation.play();
        }, 2000); // Laisse l'écran de résultat 2 secondes
    }

    // Touche 'H' pour HACKER (Lancer le QCM)
    window.addEventListener("keydown", (evt) => {
        if (evt.key.toLowerCase() === "h" && !isQcmActive) {
            triggerQCM();
        }
    });
    // ----------------------------------------------

    // Callback pour forcer la fin du saut (simplifié)
    if(animGroupsObj["jump"]) {
        animGroupsObj["jump"].group.onAnimationGroupEndObservable.add((grp) => {
            if(grp === currentAnimation && isJumping) {
                playAnimation("fall");
            }
        });
    }
    if(animGroupsObj["land"]) {
        animGroupsObj["land"].group.onAnimationGroupEndObservable.add((grp) => {
            if(grp === currentAnimation && isLanding) {
                isLanding = false;
                currentAnimation = null; // force recalcul de l'anim de déplacement
            }
        });
    }

    scene.onBeforeRenderObservable.add(() => {
        let deltaTime = engine.getDeltaTime() / 1000.0;
        let walkDir = new BABYLON.Vector3(0, 0, 0);
        
        let zPos = inputMap["z"];
        let sPos = inputMap["s"];
        let qPos = inputMap["q"];
        let dPos = inputMap["d"];
        let walk = inputMap["shift"];

        let keySuffix = "";
        
        if (zPos && qPos) { walkDir.z += 1; walkDir.x -= 1; keySuffix = "zq"; }
        else if (zPos && dPos) { walkDir.z += 1; walkDir.x += 1; keySuffix = "zd"; }
        else if (sPos && qPos) { walkDir.z -= 1; walkDir.x -= 1; keySuffix = "sq"; }
        else if (sPos && dPos) { walkDir.z -= 1; walkDir.x += 1; keySuffix = "sd"; }
        else if (zPos) { walkDir.z += 1; keySuffix = "z"; }
        else if (sPos) { walkDir.z -= 1; keySuffix = "s"; }
        else if (qPos) { walkDir.x -= 1; keySuffix = "q"; }
        else if (dPos) { walkDir.x += 1; keySuffix = "d"; }

        // Mouvement (même en sautant on garde l'inertie horizontale actuelle)
        if (keySuffix !== "") {
            walkDir.normalize();
            let currentSpeed = walk ? moveSpeedWalk : moveSpeedJog;
            hero.position.addInPlace(walkDir.scale(currentSpeed * deltaTime));
        }

        // --- Logique du saut ---
        if (inputMap["space"] && !isJumping && !isLanding) {
            isJumping = true;
            verticalVelocity = 6.0; // Puissance du saut
            playAnimation("jump");
        }

        if (isJumping) {
            hero.position.y += verticalVelocity * deltaTime;
            verticalVelocity += gravity * deltaTime;

            // Chute
            if (verticalVelocity < 0 && currentAnimation !== animGroupsObj["fall"]?.group && currentAnimation !== animGroupsObj["jump"]?.group) {
                playAnimation("fall");
            }

            // Atterrissage
            if (hero.position.y <= 0) {
                hero.position.y = 0;
                isJumping = false;
                isLanding = true;
                playAnimation("land");
                verticalVelocity = 0;
            }
        } else if (!isLanding) {
            const isAbilityAnimationLocked = Date.now() < abilityAnimationLockUntil;

            // Choix de l'animation de déplacement horizontal
            if (!isAbilityAnimationLocked && keySuffix !== "") {
                let prefix = walk ? "walk_" : "jog_";
                playAnimation(prefix + keySuffix);
            } else if (!isAbilityAnimationLocked) {
                if (currentAnimation) {
                    currentAnimation.stop();
                    currentAnimation = null;
                }
            }
        }

        camera.target = hero.position.clone().add(new BABYLON.Vector3(0, 1, 0));
    });

    // Instructions retirées d'ici, remises dans le HTML
    return scene;
};

createScene().then(scene => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});

window.addEventListener("resize", () => {
    engine.resize();
});

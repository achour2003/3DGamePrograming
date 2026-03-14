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
    
    // On garde une trace de l'animation courante
    let currentAnimation = null;
    let animGroupsObj = {};

    // Fonction pour charger et lier une animation
    async function loadAnimation(folder, file, keyName, isLooping = true) {
        try {
            const animResult = await BABYLON.SceneLoader.LoadAssetContainerAsync(folder, file, scene);
            if (animResult.animationGroups.length > 0) {
                const animGroup = animResult.animationGroups[0];
                animGroup.targetedAnimations.forEach(ta => {
                    const originalNode = ta.target;
                    if(originalNode && originalNode.name) {
                        const heroNode = scene.getNodeByName(originalNode.name);
                        if (heroNode) ta.target = heroNode;
                    }
                });
                
                // Activer le blending pour des transitions fluides
                animGroup.enableBlending = true;
                animGroup.blendingSpeed = 0.05;
                
                scene.animationGroups.push(animGroup);
                animGroup.stop();
                animGroupsObj[keyName] = { group: animGroup, looping: isLooping };
            }
        } catch (e) {
            console.error("Erreur avec " + file, e);
        }
    }

    // Charger les animations de Jog (8 directions)
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Fwd.glb", "jog_z");
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Bwd.glb", "jog_s");
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Left.glb", "jog_q");
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Right.glb", "jog_d");
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Fwd_Left.glb", "jog_zq");
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Fwd_Right.glb", "jog_zd");
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Bwd_Left.glb", "jog_sq");
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Bwd_Right.glb", "jog_sd");
    
    // Charger les animations de marche (Walk - 8 directions)
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Fwd.glb", "walk_z");
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Bwd.glb", "walk_s");
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Left.glb", "walk_q");
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Right.glb", "walk_d");
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Fwd_Left.glb", "walk_zq");
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Fwd_Right.glb", "walk_zd");
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Bwd_Left.glb", "walk_sq");
    await loadAnimation("annim/wolk/", "MF_Unarmed_Walk_Bwd_Right.glb", "walk_sd");

    // Charger les animations de saut (Jump)
    await loadAnimation("annim/jump/", "MM_Jump.glb", "jump", false);
    await loadAnimation("annim/jump/", "MM_Fall_Loop.glb", "fall", true);
    await loadAnimation("annim/jump/", "MM_Land.glb", "land", false);

    let isMoving = false;
    let inputMap = {};
    let isJumping = false;
    let isLanding = false;

    window.addEventListener("keydown", (evt) => {
        let key = evt.key.toLowerCase();
        if(key === " ") key = "space";
        if(evt.shiftKey) inputMap["shift"] = true;
        inputMap[key] = true;
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

    // Fonction pour jouer l'animation avec un fade
    function playAnimation(animKey) {
        let animObj = animGroupsObj[animKey];
        if (!animObj || currentAnimation === animObj.group) return;
        
        // Mettre en balance le poids si on avait déjà une anim pour crossfade
        if (currentAnimation) {
            // Un fondu sera automatiquement géré par enableBlending = true
            currentAnimation.stop();
        }
        currentAnimation = animObj.group;
        currentAnimation.play(animObj.looping);
    }

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
            // Choix de l'animation de déplacement horizontal
            if (keySuffix !== "") {
                let prefix = walk ? "walk_" : "jog_";
                playAnimation(prefix + keySuffix);
            } else {
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

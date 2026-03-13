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
    async function loadAnimation(folder, file, keyName) {
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
                scene.animationGroups.push(animGroup);
                animGroup.stop();
                animGroupsObj[keyName] = animGroup;
            }
        } catch (e) {
            console.error("Erreur avec " + file, e);
        }
    }

    // Loader toutes les anims de Jog (Z, Q, S, D) - Clavier AZERTY
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Fwd.glb", "z");
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Bwd.glb", "s");
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Left.glb", "q");
    await loadAnimation("annim/jog/", "MF_Unarmed_Jog_Right.glb", "d");
    
    // Pour l'animation d'attente (idle), si pas dispo on utilise juste pas d'anim ou la première dispo
    // Si vous avez un idle, ajoutez-le ici: await loadAnimation("annim/", "Idle.glb", "idle");

    let isMoving = false;
    let inputMap = {};

    window.addEventListener("keydown", (evt) => {
        let key = evt.key.toLowerCase();
        inputMap[key] = true;
    });

    window.addEventListener("keyup", (evt) => {
        let key = evt.key.toLowerCase();
        inputMap[key] = false;
    });

    // Vitesse de déplacement
    const moveSpeed = 4.0; 

    // Mettre à jour la logique à chaque frame
    scene.onBeforeRenderObservable.add(() => {
        let deltaTime = engine.getDeltaTime() / 1000.0;
        let moved = false;
        let walkDir = new BABYLON.Vector3(0, 0, 0);
        let animToPlay = null;

        // Détection des touches Z Q S D (AZERTY)
        if (inputMap["z"]) {
            walkDir.z += 1;
            animToPlay = animGroupsObj["z"];
            moved = true;
        } else if (inputMap["s"]) {
            walkDir.z -= 1;
            animToPlay = animGroupsObj["s"];
            moved = true;
        }
        
        if (inputMap["q"]) {
            walkDir.x -= 1;
            if(!inputMap["z"] && !inputMap["s"]) animToPlay = animGroupsObj["q"];
            moved = true;
        } else if (inputMap["d"]) {
            walkDir.x += 1;
            if(!inputMap["z"] && !inputMap["s"]) animToPlay = animGroupsObj["d"];
            moved = true;
        }

        // Si le perso bouge
        if (moved) {
            // Normaliser le vecteur de déplacement pour pas aller plus vite en diagonale
            walkDir.normalize();

            // Mettre à jour la position
            hero.position.addInPlace(walkDir.scale(moveSpeed * deltaTime));
            
            // Jouer l'animation de mouvement si elle n'est pas déjà en cours
            if (animToPlay && currentAnimation !== animToPlay) {
                if (currentAnimation) currentAnimation.stop();
                currentAnimation = animToPlay;
                currentAnimation.play(true);
            }
        } else {
            // Si on ne bouge plus, on arrête l'animation
            if (currentAnimation) {
                currentAnimation.stop();
                currentAnimation = null;
            }
        }
        
        // La caméra suit le personnage (basique)
        camera.target = hero.position.clone().add(new BABYLON.Vector3(0, 1, 0));
    });

    // Mettre à jour les instructions HTML
    document.getElementById("animList").innerHTML = "<li>Z : Avancer (Jog Fwd)</li><li>S : Reculer (Jog Bwd)</li><li>Q : Gauche (Jog Left)</li><li>D : Droite (Jog Right)</li>";

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

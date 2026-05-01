import sys

filepath = "override_campus_zero (2).html"

with open(filepath, 'rb') as f:
    content = f.read()

text = content.decode('utf-8')

# Remove the hardcoded enemyCampus creation in GLB block and use spawnActiveBoss
old_glb_enemy = """    // Ajouter un ennemi dans le niveau PBR
    const enemyCampus = BABYLON.MeshBuilder.CreateBox("boss_dummy", {size:2}, scene);
    enemyCampus.position.set(0, 1.5, -20);
    const mEC = new BABYLON.StandardMaterial("mec", scene);
    mEC.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.1);
    mEC.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
    enemyCampus.material = mEC;
    
    if (scene.shadowGenerator) {
        scene.shadowGenerator.addShadowCaster(enemyCampus, true);
    }

    let alphaCampus = 0;
    scene.registerBeforeRender(() => {
      alphaCampus += 0.05;
      enemyCampus.position.y = 1.5 + Math.sin(alphaCampus) * 0.2;
      enemyCampus.rotation.y += 0.02;
    });

    scene.enemyAlpha = enemyCampus;"""

new_glb_enemy = """    // Spawn dynamique du boss
    if (window.spawnActiveBoss) {
        window.spawnActiveBoss(scene);
        if (scene.shadowGenerator && scene.activeBoss) {
            scene.shadowGenerator.addShadowCaster(scene.activeBoss, true);
        }
    }"""

if old_glb_enemy in text:
    text = text.replace(old_glb_enemy, new_glb_enemy)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)
    print("GLB boss spawn patched successfully!")
else:
    print("old_glb_enemy block not found exactly as written.")

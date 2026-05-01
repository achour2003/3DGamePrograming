import sys

filepath = "override_campus_zero (2).html"

with open(filepath, 'rb') as f:
    content = f.read()

text = content.decode('utf-8')

old_str = """    // Ennemi conserve: cube rouge
    const enemyCampus = BABYLON.MeshBuilder.CreateBox("enemyObj", {size: 1.5}, scene);
    enemyCampus.position.set(0, 1.5, -15);
    const mEnemyCampus = new BABYLON.StandardMaterial("mEnemy", scene);
    mEnemyCampus.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1);
    mEnemyCampus.emissiveColor = new BABYLON.Color3(0.5, 0.0, 0.0);
    enemyCampus.material = mEnemyCampus;
    enemyCampus.receiveShadows = true;

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

new_str = """    // Spawner le Boss Actif de la Progression
    if (window.spawnActiveBoss) {
        window.spawnActiveBoss(scene);
        if (scene.shadowGenerator && scene.activeBoss) {
            scene.shadowGenerator.addShadowCaster(scene.activeBoss, true);
        }
    }"""

if old_str in text:
    text = text.replace(old_str, new_str)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)
    print("GLB Boss patched successfully!")
else:
    print("Could not find old_str!")

import sys, re

filepath = "override_campus_zero (2).html"

with open(filepath, 'rb') as f:
    content = f.read()

text = content.decode('utf-8')

old_enemy_spawn = """  const enemy = BABYLON.MeshBuilder.CreateBox("enemyObj", {size: 1.5}, scene);
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

# Replace by spawnActiveBoss
new_enemy_spawn = """  if (window.spawnActiveBoss) {
      window.spawnActiveBoss(scene);
  }"""

# Using regex because unicode chars like Ã© might mismatch depending on how text was loaded
text = re.sub(r'const enemy = BABYLON\.MeshBuilder\.CreateBox\("enemyObj".*?scene\.enemyAlpha = enemy;', new_enemy_spawn, text, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Patch Boss Rush Step 2 ready.")

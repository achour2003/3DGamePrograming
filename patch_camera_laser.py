#!/usr/bin/env python3
import sys

filepath = "override_campus_zero (2).html"

with open(filepath, 'rb') as f:
    content = f.read()

text = content.decode('utf-8')

start_marker = "function restoreOccludingMeshes()"
start_idx = text.find(start_marker)

if start_idx == -1:
    print("Error: start_marker not found")
    sys.exit(1)

resolve_marker = "function resolveCameraObstruction"
resolve_idx = text.find(resolve_marker, start_idx)

if resolve_idx == -1:
    print("Error: resolve_marker not found")
    sys.exit(1)

# Find end of resolveCameraObstruction
brace_count = 0
in_func = False
func_end = resolve_idx
for i in range(resolve_idx, len(text)):
    if text[i] == '{':
        brace_count += 1
        in_func = True
    elif text[i] == '}':
        brace_count -= 1
        if in_func and brace_count == 0:
            func_end = i + 1
            break

new_code = """function setMeshTransparencyMode(mesh, isTransparent) {
  if (!mesh.material) return;
  const setMode = (mat) => {
    if (!mat) return;
    if (mat.subMaterials) {
      mat.subMaterials.forEach(setMode);
    } else if (typeof mat.transparencyMode !== "undefined") {
      if (isTransparent && mat.transparencyMode === 0) {
        mat.transparencyMode = 2; // ALPHABLEND
        mat.needDepthPrePass = true;
      } else if (!isTransparent && mat.transparencyMode === 2) {
        mat.transparencyMode = 0; // OPAQUE
        mat.needDepthPrePass = false;
      }
    }
  };
  setMode(mesh.material);
}

function restoreOccludingMeshes() {
  const toRemove = [];
  G.occludingMeshes.forEach((mesh) => {
    if (mesh && !mesh.isDisposed()) {
      mesh.visibility = BABYLON.Scalar.Lerp(mesh.visibility, 1.0, 0.08);
      if (mesh.visibility > 0.98) {
        mesh.visibility = 1.0;
        // Le laser ne touche plus : On repasse le mur en solide (OPAQUE)
        setMeshTransparencyMode(mesh, false);
        toRemove.push(mesh);
      }
    } else {
      toRemove.push(mesh);
    }
  });
  toRemove.forEach(m => G.occludingMeshes.delete(m));
}

function resolveCameraObstruction(scene, camera, target, playerMesh, desiredRadius) {
  camera.computeWorldMatrix();

  const toCamera = camera.position.subtract(target);
  if (toCamera.length() < 0.001) return false;
  const dir = toCamera.normalize();

  // === TON IDÉE : LE LASER ===
  // On envoie un laser du personnage jusqu'à la position souhaitée de la caméra
  const ray = new BABYLON.Ray(target, dir, desiredRadius);
  
  // On récupère absolument TOUS les obstacles traversés par ce laser
  const hits = scene.multiPickWithRay(ray, (m) => {
    if (!m || m.isDisposed() || m === playerMesh || !m.checkCollisions || !m.isPickable) return false;
    let c = m; while(c) { if (c === playerMesh || c.name.startsWith("player")) return false; c = c.parent; }
    return true;
  });

  const currentOccluders = new Set();
  let safeRadius = desiredRadius;

  if (hits && hits.length > 0) {
    // On trie les obstacles du plus proche au plus loin
    hits.sort((a, b) => a.distance - b.distance);
    
    // Le premier obstacle touché par le laser
    const closestDist = hits[0].distance;
    
    // La caméra se rapproche et pénètre jusqu'à frôler l'obstacle
    const targetSafeRadius = closestDist - 0.2;
    
    // Mais on empêche la caméra de rentrer dans la tête du personnage !
    if (targetSafeRadius < 1.5) {
        safeRadius = 1.5;
    } else {
        safeRadius = targetSafeRadius;
    }

    // Tous les objets traversés par le laser deviennent semi-transparents !
    hits.forEach(h => {
        if (h.distance <= desiredRadius) {
            currentOccluders.add(h.pickedMesh);
        }
    });
  }

  // === RESTAURATION ===
  const toRemove = [];
  G.occludingMeshes.forEach((mesh) => {
    if (currentOccluders.has(mesh)) return; // Le laser le touche encore
    if (mesh && !mesh.isDisposed()) {
      mesh.visibility = BABYLON.Scalar.Lerp(mesh.visibility, 1.0, 0.08);
      if (mesh.visibility > 0.98) {
        mesh.visibility = 1.0;
        setMeshTransparencyMode(mesh, false); // OPAQUE
        toRemove.push(mesh);
      }
    } else {
      toRemove.push(mesh);
    }
  });
  toRemove.forEach(m => G.occludingMeshes.delete(m));

  // === FADE DES OCCULTANTS ===
  currentOccluders.forEach((mesh) => {
    if (mesh && !mesh.isDisposed()) {
      G.occludingMeshes.add(mesh);
      
      // FIX POUR LES MURS EN 3D : Autoriser la transparence
      // (C'était ça le bug avant, Babylon empêchait le mur d'être transparent !)
      setMeshTransparencyMode(mesh, true);
      
      // On rend l'obstacle semi-transparent (0.15 = presque invisible)
      mesh.visibility = BABYLON.Scalar.Lerp(mesh.visibility, 0.15, 0.15);
    }
  });

  // === DÉPLACEMENT DE LA CAMÉRA ===
  if (safeRadius < camera.radius) {
    camera.radius = BABYLON.Scalar.Lerp(camera.radius, safeRadius, 0.25); // Se rapproche vite
  } else {
    camera.radius = BABYLON.Scalar.Lerp(camera.radius, safeRadius, 0.05); // S'éloigne doucement
  }

  return currentOccluders.size > 0;
}"""

text = text[:start_idx] + new_code + text[func_end:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Patch v4 applied successfully!")

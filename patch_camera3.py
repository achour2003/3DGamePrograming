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

new_code = """function restoreOccludingMeshes() {
  const toRemove = [];
  G.occludingMeshes.forEach((mesh) => {
    if (mesh && !mesh.isDisposed()) {
      mesh.visibility = BABYLON.Scalar.Lerp(mesh.visibility, 1.0, 0.08);
      if (mesh.visibility > 0.98) {
        mesh.visibility = 1.0;
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
  const dist = toCamera.length();
  if (dist < 0.001) return false;

  const dir = toCamera.normalize();

  // Rayon du joueur vers la caméra
  const ray = new BABYLON.Ray(target, dir, desiredRadius);
  
  // AAA: On récupère TOUS les obstacles sur la ligne de vue (supporte les murs épais)
  const hits = scene.multiPickWithRay(ray, (m) => {
    if (!m || m.isDisposed() || m === playerMesh || !m.checkCollisions || !m.isPickable) return false;
    let c = m; while(c) { if (c === playerMesh || c.name.startsWith("player")) return false; c = c.parent; }
    return true;
  });

  const currentOccluders = new Set();
  let safeRadius = desiredRadius;

  if (hits && hits.length > 0) {
    // Trier du plus proche au plus éloigné
    hits.sort((a, b) => a.distance - b.distance);
    
    const closestDist = hits[0].distance;
    const buffer = 0.35; // Distance de sécurité avec le mur
    const targetSafeRadius = closestDist - buffer;
    
    // Le compromis AAA: on ne se rapproche jamais à moins de camMinObstructionR (ex: 1.6m)
    // Si l'obstacle est plus proche que ça, la caméra refuse d'aller plus près et on rend le mur transparent !
    if (targetSafeRadius < (CFG.camMinObstructionR || 1.6)) {
        safeRadius = (CFG.camMinObstructionR || 1.6);
    } else {
        safeRadius = targetSafeRadius;
    }

    // Tous les objets qui sont ENTRE le joueur et la position calculée de la caméra 
    // doivent disparaître (avec un petit buffer pour le mur dans lequel on est)
    hits.forEach(h => {
        if (h.distance < safeRadius + 0.2) {
            currentOccluders.add(h.pickedMesh);
        }
    });
  }

  // === RESTAURATION DES MURS QUI NE GÊNENT PLUS ===
  const toRemove = [];
  G.occludingMeshes.forEach((mesh) => {
    if (currentOccluders.has(mesh)) return; // Encore occultant, on le laisse
    if (mesh && !mesh.isDisposed()) {
      mesh.visibility = BABYLON.Scalar.Lerp(mesh.visibility, 1.0, CFG.camFadeOutSpeed || 0.06);
      if (mesh.visibility > 0.98) {
        mesh.visibility = 1.0;
        toRemove.push(mesh);
      }
    } else {
      toRemove.push(mesh);
    }
  });
  toRemove.forEach(m => G.occludingMeshes.delete(m));

  // === FADE DES MURS OCCULTANTS ===
  currentOccluders.forEach((mesh) => {
    if (mesh && !mesh.isDisposed()) {
      G.occludingMeshes.add(mesh);
      // Rendu très transparent (0.15) pour bien voir à travers
      mesh.visibility = BABYLON.Scalar.Lerp(mesh.visibility, CFG.camFadeTarget || 0.15, CFG.camFadeInSpeed || 0.12);
    }
  });

  // === MOUVEMENT FLUIDE DE LA CAMÉRA ===
  if (safeRadius < camera.radius) {
    // Zoom IN (plus réactif pour ne pas rentrer dans le mur)
    camera.radius = BABYLON.Scalar.Lerp(camera.radius, safeRadius, CFG.camCutInSpeed || 0.25);
  } else {
    // Zoom OUT (plus doux quand l'espace se libère)
    camera.radius = BABYLON.Scalar.Lerp(camera.radius, safeRadius, CFG.camRestoreSpeed || 0.05);
  }

  return currentOccluders.size > 0;
}"""

text = text[:start_idx] + new_code + text[func_end:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Patch applied successfully!")

#!/usr/bin/env python3
import sys

filepath = "override_campus_zero (2).html"

with open(filepath, 'rb') as f:
    content = f.read()

text = content.decode('utf-8')

start_marker = "function setMeshTransparencyMode("
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

  const ray = new BABYLON.Ray(target, dir, desiredRadius);
  
  const hits = scene.multiPickWithRay(ray, (m) => {
    if (!m || m.isDisposed() || m === playerMesh || !m.checkCollisions || !m.isPickable) return false;
    let c = m; while(c) { if (c === playerMesh || c.name.startsWith("player")) return false; c = c.parent; }
    return true;
  });

  const currentOccluders = new Set();
  let safeRadius = desiredRadius;

  if (hits && hits.length > 0) {
    hits.sort((a, b) => a.distance - b.distance);
    const closestDist = hits[0].distance;
    const targetSafeRadius = closestDist - 0.2;
    
    if (targetSafeRadius < 1.5) {
        safeRadius = 1.5;
    } else {
        safeRadius = targetSafeRadius;
    }

    hits.forEach(h => {
        if (h.distance <= desiredRadius) {
            currentOccluders.add(h.pickedMesh);
        }
    });
  }

  // === TON IDÉE : GESTION DES COLLISIONS DE LA CAMÉRA ===
  // Si le laser détecte un obstacle direct entre le joueur et la caméra, 
  // on désactive les collisions pour que la caméra puisse pénétrer et rendre le mur transparent.
  // Sinon, on active les collisions natives de Babylon pour que la caméra "glisse"
  // physiquement contre les murs sur les côtés sans rentrer dedans par erreur !
  if (currentOccluders.size > 0) {
      camera.checkCollisions = false;
  } else {
      camera.checkCollisions = true;
      if (!camera.collisionRadius) {
          camera.collisionRadius = new BABYLON.Vector3(0.4, 0.4, 0.4);
      }
  }

  // === RESTAURATION ===
  const toRemove = [];
  G.occludingMeshes.forEach((mesh) => {
    if (currentOccluders.has(mesh)) return;
    if (mesh && !mesh.isDisposed()) {
      mesh.visibility = BABYLON.Scalar.Lerp(mesh.visibility, 1.0, 0.08);
      if (mesh.visibility > 0.98) {
        mesh.visibility = 1.0;
        setMeshTransparencyMode(mesh, false);
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
      setMeshTransparencyMode(mesh, true);
      mesh.visibility = BABYLON.Scalar.Lerp(mesh.visibility, 0.15, 0.15);
    }
  });

  // === DÉPLACEMENT DE LA CAMÉRA ===
  if (safeRadius < camera.radius) {
    camera.radius = BABYLON.Scalar.Lerp(camera.radius, safeRadius, 0.25);
  } else {
    camera.radius = BABYLON.Scalar.Lerp(camera.radius, safeRadius, 0.05);
  }

  return currentOccluders.size > 0;
}"""

text = text[:start_idx] + new_code + text[func_end:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Patch v5 applied successfully!")

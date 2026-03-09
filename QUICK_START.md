# 🎮 LANCER LE JEU - Guide Rapide

## ⚡ 30 Secondes pour Jouer

### Windows PowerShell
```powershell
cd "c:\Users\djera\OneDrive\Desktop\Dernier Refuge"
python -m http.server 8000
```
Puis ouvrir: **http://localhost:8000/game3d.html**

### Alternative: Double-clic
1. Allez dans le dossier `Dernier Refuge`
2. Double-cliquez sur **`game3d.html`**
3. Le jeu se lance dans votre navigateur

---

## 🎯 Dès que le jeu se Charge

1. **Cliquez "Commencer"** - Titre screen vers gameplay
2. **La scène 3D se charge** - Attendez 2-3 secondes
3. **Vous voyez la caméra 3D** - Arena avec joueur et ennemis
4. **Choisissez une action**:
   - ⚔️ **Attaquer** - Dégâts normaux
   - ✨ **Capacité** - Attaque puissante
   - 🛡️ **Défendre** - Réduit dégâts
   - 🔧 **Pirater** - Contrôle IA

5. **Regardez l'animation** - Joueur attaque, ennemis réagissent
6. **Ennemi joue** - IA calcule et choisit la meilleure action
7. **Répétez** jusqu'à victoire ou défaite

---

## 🎮 Commandes In-Game

| Touche | Action |
|--------|--------|
| **Souris Click** | Cliquer boutons d'action |
| **Souris Scroll** | Zoom caméra |
| **Souris Drag** | Rotation caméra |
| **D** | Toggle Debug Mode |

---

## 📊 Debug Mode (Touche D)

Affiche:
- **FPS** - Frames par seconde (60 = bon)
- **AI Info** - Dernière décision de l'IA
- **Camera Distance** - Distance caméra actuelle

Utile pour:
- Vérifier performance
- Voir comment l'IA décide
- Ajuster comportement

---

## 🔧 Si ça ne Marche Pas

### ✗ "Cannot find module" ou erreur CORS
**Solution:**
```powershell
python -m http.server 8000
# Puis ouvrir: http://localhost:8000/game3d.html
```

### ✗ Écran noir après "Commencer"
**Attendez 3-5 secondes** - Babylon.js charge la scène 3D

Ou vérifiez:
- Navigateur supporte WebGL (Chrome, Firefox, Edge)
- Console (F12) pour erreurs

### ✗ Ennemis ne s'affichent pas
**Vérifiez:** 
- `enemy-templates.js` est chargé
- Console (F12) → aucune erreur rouge

---

## 🎨 Tester les Variations

### Changer les Ennemis
Éditez `game3d.js` ligne ~590:

```javascript
// Remplacer ceci:
const enemiesData = COMBAT_TEMPLATES.ACT1_INTRO.enemies

// Par ceci (autres combats):
const enemiesData = COMBAT_TEMPLATES.ACT3_BOSS.enemies
// Ou
const enemiesData = COMBAT_TEMPLATES.ACT5_FINAL.enemies
```

Combats disponibles:
- `ACT1_INTRO` - Facile (2 ennemis)
- `ACT1_BOSS` - Cache Demon (1 boss)
- `ACT3_BOSS` - Neural Network (1 boss complexe)
- `ACT5_FINAL` - ARIA (BOSS FINAL!)

### Changer Difficulté Joueur
Éditez `game3d.js` ligne ~574:

```javascript
const playerData = {
  name: 'Kaleb',
  maxHP: 100,    // ← Augmenter pour plus facile
  attack: 15,    // ← Augmenter pour plus fort
  defense: 10,   // ← Augmenter pour moins de dégâts
  speed: 8       // ← Augmenter pour jouer en premier
};
```

---

## 📈 Progression Conseillée

1. **Commencez avec ACT1_INTRO** (facile)
   - 2 ennemis simples
   - Comprendre le combat

2. **Passez à ACT1_BOSS** (moyen)
   - 1 boss avec plus de HP
   - IA plus agressive

3. **Essayez ACT3_BOSS** (difficile)
   - Boss multi-couche
   - Comprendre pattern IA

4. **Affrontez ACT5_FINAL** (expert)
   - ARIA finale
   - Boss prédictive avec apprentissage

---

## 🎯 Objectifs de Test

### Gameplay
- [ ] Vérifiez que l'IA joue des actions variées
- [ ] Vérifiez que l'IA défend si HP faible
- [ ] Vérifiez que l'IA attaque agressif si joueur faible
- [ ] Vérifiez dégâts flottants s'affichent

### Visuels
- [ ] Scène 3D charge
- [ ] Joueur et ennemis visibles
- [ ] Particules autour des personnages
- [ ] HP bars animées
- [ ] Caméra dragueable

### IA
- [ ] Appuyez D pour debug
- [ ] Vérifiez "AI Info" affiche les décisions
- [ ] Vérifiez l'IA varie ses actions (pas toujours ATK)
- [ ] Vérifiez pattern penalty évite répétitions

---

## 💾 Sauvegarder Progress (Futur)

Actuellement: pas de sauvegarde entre combats

À implémenter:
```javascript
// Sauvegarder après victoire
localStorage.setItem('gameProgress', JSON.stringify({
  actsCompleted: [1, 2, 3],
  playerStats: {...},
  enemiesDefeated: [...],
  totalCoins: 500
}));

// Charger
const progress = JSON.parse(localStorage.getItem('gameProgress'));
```

---

## 🚀 Prochaines Améliorations Faciles

### Ajouter Musique (5 min)
```javascript
const music = new Audio('music.mp3');
music.loop = true;
music.play();
```

### Ajouter Dialogues Ennemis (10 min)
```javascript
if (combatSystem.currentEnemy.name === 'ARIA') {
  showDialogue('ARIA', 'Je vois vos pensées...');
}
```

### Ajouter Loot Drops (15 min)
```javascript
if (combatSystem.combatState === 'PLAYER_WIN') {
  const loot = Math.floor(Math.random() * 100);
  showLoot('Gold +' + loot);
}
```

---

## 📞 Troubleshooting Avancé

### Performance Issue
```javascript
// Réduire particules dans game3d.js
particleSystem.emitRate = 10;  // de 50

// Désactiver shadows
scene.shadowsEnabled = false;
```

### Ennemi Too Strong
```javascript
// Réduire HP/ATK dans enemy-templates.js
NEURAL_NETWORK: {
  maxHP: 150 → 100,  // Moins de HP
  attack: 18 → 12,   // Moins de dégâts
}
```

### IA Too Smart
```javascript
// Réduire variance scoring dans ai-system.js
// Changer:
score += Math.random() * 10;
// En:
score += Math.random() * 5;  // Moins de hasard = plus prévisible
```

---

## ✨ Résumé Rapide

```
1. Ouvrir game3d.html
   ↓
2. Cliquer "Commencer"
   ↓
3. Scène 3D charge (attendez)
   ↓
4. Choisir action
   ↓
5. Animer attaque + calcul IA
   ↓
6. Répéter jusqu'à que quelqu'un gagne
   ↓
7. Écran fin (victoire/défaite)
   ↓
8. Cliquer "Continuer" pour relancer
```

---

**Amusez-vous! 🎮✨**

Et n'oubliez pas: appuyez sur **D** pour voir l'IA déboguer ses décisions. C'est fascinant!

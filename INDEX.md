# 🎯 Index Rapide - Campus Zero 3D

## 🎮 Pour Jouer Immédiatement
- **Ouvrir:** `game3d.html`
- **Guide:** [QUICK_START.md](QUICK_START.md) (30 secondes)
- **Commandes:** Faire défiler jusqu'à "Commandes In-Game"

---

## 📚 Documentation par Usage

### Je suis un Joueur
1. Lire: [QUICK_START.md](QUICK_START.md)
2. Ouvrir: `game3d.html`
3. Cliquer play!

### Je suis un Développeur (JS)
1. Lire: [SETUP_GUIDE.md](SETUP_GUIDE.md) (Architecture)
2. Lire: [FILE_STRUCTURE.md](FILE_STRUCTURE.md) (Fichiers)
3. Étudier: `game3d.js` (Moteur)
4. Étudier: `ai-system.js` (IA)

### Je veux Comprendre l'IA
1. Lire: [AI_TECHNICAL_GUIDE.md](AI_TECHNICAL_GUIDE.md)
2. Étudier: `ai-system.js`
3. Activer: Debug Mode (touche D)

### Je veux Customiser
1. Lire: [SETUP_GUIDE.md](SETUP_GUIDE.md) section "Customisation"
2. Éditer: `enemy-templates.js` (facile!)
3. Éditer: `game3d.js` (avancé)

### Je veux Ajouter du Contenu
1. Ajouter ennemis: `enemy-templates.js` ligne 7
2. Ajouter combats: `enemy-templates.js` ligne 95
3. Ajouter compétences: `combat-system.js` ligne 180

### Je Troubleshoot
1. Consulter: [QUICK_START.md](QUICK_START.md) section "Si ça ne Marche Pas"
2. Appuyer F12 → Console pour erreurs
3. Vérifier: Tous les scripts chargent (Network tab F12)

---

## 📁 Fichiers Importants

### À Ouvrir pour Jouer
```
game3d.html         ⭐⭐⭐ CELUI-CI!
```

### À Lire pour Chercher Info
```
QUICK_START.md      - Lancer rapidement
SETUP_GUIDE.md      - Configuration totale
README_3D.md        - Gameplay complet
AI_TECHNICAL_GUIDE.md - Détails IA
FILE_STRUCTURE.md   - Où est quoi
```

### À Éditer pour Customiser
```
enemy-templates.js  ⭐ Changer ennemis
game3d.js           - Changer joueur/scène
style3d.css         - Changer couleurs
ai-system.js        - Changer IA (avancé)
```

---

## 🔍 Rechercher une Fonction

### Dans game3d.js
- `initializeBabylon()` - Setup 3D
- `setupCamera()` - Caméra
- `createPlayerModel()` - Joueur 3D
- `createEnemyModel()` - Ennemi 3D
- `animateAttack()` - Animation attaque
- `executePlayerAction()` - Action joueur

### Dans combat-system.js
- `class Character` - Stats perso
- `class CombatSystem` - Logique combat
- `playerAttack()` - Attaque joueur
- `enemyTurn()` - Tour ennemi
- `executeRound()` - Boucle tour

### Dans ai-system.js
- `calculateBestMove()` - ⭐ Décision IA
- `generatePossibleActions()` - Explore actions
- `scoreActions()` - Évalue actions (8 facteurs!)
- `estimateDamage()` - Calcule dégâts

### Dans enemy-templates.js
- `ENEMY_TEMPLATES` - Définitions ennemis
- `COMBAT_TEMPLATES` - Combats prédéfinis
- `generateRandomCombat()` - Combat aléatoire
- `scaleEnemyToDifficulty()` - Scaling

---

## 🎮 Combats Disponibles

À sélectionner dans `game3d.js` ligne ~580:

```javascript
COMBAT_TEMPLATES.ACT1_INTRO      // Facile
COMBAT_TEMPLATES.ACT1_BOSS       // Normal
COMBAT_TEMPLATES.ACT3_BOSS       // Difficile
COMBAT_TEMPLATES.ACT5_FINAL      // Expert (ARIA)
```

---

## 🛠️ Modifications Fréquentes

### Augmenter difficulté
[game3d.js] ligne ~574
```javascript
maxHP: 100 → 80
attack: 15 → 12
```

### Ajouter nouvel ennemi
[enemy-templates.js] ligne ~7
```javascript
MY_ENEMY: {
  name: 'Nouveau',
  maxHP: 100,
  // ...
}
```

### Créer nouveau combat
[enemy-templates.js] ligne ~95
```javascript
MY_COMBAT: {
  name: 'Mon Combat',
  enemies: [ENEMY_TEMPLATES.MY_ENEMY],
}
```

### Changer couleurs
[style3d.css] ligne ~5
```css
--accent: #00d4ff;  ← Changer ici
```

---

## 🐛 Debug

Touche D dans le jeu for:
- FPS counter
- IA decision display
- Camera distance

Console (F12) pour:
- JavaScript errors
- aiSystem.toggleDebug()
- console.log() statements

---

## 📞 Important Links

### Babylon.js
- [Oficial Doc](https://doc.babylonjs.com/)
- [Playground](https://playground.babylonjs.com/)
- [Materials](https://www.babylonjs-playground.com/materials)

### JavaScript
- [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [ES6 Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)

### Game Development
- [GDC Vault](https://www.gdcvault.com/)
- AI theory: Game Theory, MinMax, MCTS

---

## 📊 Checklist Avant Partage

- [ ] Tous les JS chargent (check console F12)
- [ ] game3d.html ouvre sans erreur
- [ ] Combat lance après "Commencer"
- [ ] Actions joueur fonctionnent
- [ ] IA joue et décide (pas crash)
- [ ] HP bars s'affichent
- [ ] Animations se lancent
- [ ] Debug mode (D key) fonctionne

---

## 🎓 Apprendre l'IA

### Niveau 1: Basis
1. Lire: Formule dans [AI_TECHNICAL_GUIDE.md](AI_TECHNICAL_GUIDE.md)
2. Activer debug (touche D)
3. Jouer et observer décisions

### Niveau 2: Détails
1. Étudier: Fonction `scoreActions()` dans `ai-system.js`
2. Comprendre: 8 facteurs de scoring
3. Tester: Modifier weights (0.3, 0.5, etc.)

### Niveau 3: Avancé
1. Implémenter: `simulateCombatOutcome()`
2. Ajouter: Minimax ou MCTS
3. Entraîner: Neural network

---

## 🚀 Commandes Terminal

### Windows - Lancer serveur
```powershell
cd "c:\Users\djera\OneDrive\Desktop\Dernier Refuge"
python -m http.server 8000
```

### MacOS/Linux - Lancer serveur
```bash
cd ~/Desktop/Dernier\ Refuge
python -m http.server 8000
```

### Puis ouvrir dans navigateur
```
http://localhost:8000/game3d.html
```

---

## 💡 Quick Tips

1. **Touche D** = Debug mode (voir décisions IA)
2. **F12** = Console (voir erreurs)
3. **Ctrl+Shift+I** = Developer tools
4. **Clic-drag souris** = Rotation caméra
5. **Scroll souris** = Zoom caméra

---

## 📈 File Sizes Reference

```
game3d.html      150 lines
game3d.js        600 lines
combat-system    400 lines
ai-system        500 lines
enemy-templates  300 lines
style3d.css      350 lines
Total: ~2300 lines of code
```

---

## ✨ Features Highlights

- ✅ 3D avec Babylon.js
- ✅ Combat JRPG tour par tour
- ✅ IA intelligente (8 facteurs!)
- ✅ 11 ennemis différents
- ✅ 8 combats prédéfinis
- ✅ Animations et FX
- ✅ UI professionnelle
- ✅ 100% Modulaire

---

**Created with ❤️ for Campus Zero**

Last Updated: Mars 2026

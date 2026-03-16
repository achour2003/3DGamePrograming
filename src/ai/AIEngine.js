import { ActionPlanner } from './layers/ActionPlanner.js';
import { TacticalEvaluator } from './layers/TacticalEvaluator.js';
import { PersonalityController } from './layers/PersonalityController.js';

export class AIEngine {
    constructor() {
        // Initialisation des 3 couches de l'Architecture
        this.planner = new ActionPlanner({ maxDepth: 3, maxPlans: 500 });
        this.evaluator = new TacticalEvaluator();
        this.controller = new PersonalityController();
    }

    /**
     * Tâche 5.2 - Binding final à la boucle 3D
     * Moteur central appelé depuis CombatSystem.js pour faire jouer un Ennemi.
     * @param {Entity} enemy - Le monstre dont c'est le tour
     * @param {Array<Entity>} allies - Ses alliés
     * @param {Array<Entity>} playerParty - Les joueurs ciblables (ex: Elior, Mira)
     * @param {Array<Object>} playerHistory - Le buffer d'actions du joueur pour la prédiction
     * @param {Object} latestEvent - Dernier évent critique (ex: si l'ennemi vient de se faire parer)
     */
    computeTurn(enemy, allies, playerParty, playerHistory, latestEvent = null) {
        console.log(`[AIEngine] Début du tour de l'IA pour: ${enemy.name} (PA dispo: ${enemy.pa})`);

        // ==========================================
        // 1. VÉRIFICATION PHASE BOSS
        // ==========================================
        this.controller.checkPhaseTransition(enemy, { phases: enemy.phasesData });

        // ==========================================
        // 2. RÉACTIONS IMMÉDIATES (OVERRIDE HORS-ARBRE)
        // ==========================================
        if (latestEvent) {
            // Petite heuristique : on prend l'attaque la plus punitive de l'ennemi (s'il en a une)
            const backupSkill = enemy.skills.find(s => s.comboTags.includes('unblockable')) || enemy.skills[0];
            
            const reactionPlan = this.controller.overrideWithReaction(
                enemy, 
                latestEvent, 
                backupSkill, 
                playerParty[0] // Frappe la première cible (souvent Elior)
            );

            if (reactionPlan) {
                this._finalizePlan(enemy, reactionPlan);
                return reactionPlan;
            }
        }

        // ==========================================
        // 3. COUCHE 1 : GÉNÉRATEUR DE CONTRAINTES
        // ==========================================
        // Backtracking: Génère tout l'arbre des possibles selon les PA.
        const possiblePlans = this.planner.generatePlans(enemy, enemy.skills, playerParty, allies);
        console.log(`[AIEngine] Couche 1 terminée : ${possiblePlans.length} plans de bataille possibles trouvés.`);

        // ==========================================
        // 4. COUCHE 2 : ÉVALUATEUR TACTIQUE
        // ==========================================
        // Note et trie mathématiquement toutes les séquences
        const scoredPlans = this.evaluator.evaluatePlans(possiblePlans, enemy, playerHistory);

        // ==========================================
        // 5. COUCHE 3 : CONTRÔLEUR DE PERSONNALITÉ
        // ==========================================
        // Roulette probabiliste selon le niveau d'intelligence (aiLevel)
        const finalPlan = this.controller.selectPlan(scoredPlans, { aiLevel: enemy.aiLevel });
        console.log(`[AIEngine] Couche 3 terminée : Plan sélectionné avec un score de ${finalPlan.score?.toFixed(1) || 0}`);

        // Mise à jour de la mémoire tampon
        this._finalizePlan(enemy, finalPlan);

        return finalPlan;
    }

    /**
     * Termine la résolution logique avant de renvoyer le plan à BabylonJS
     */
    _finalizePlan(enemy, finalPlan) {
        // Enregistre ce plan pour activer le Malus Anti-Robot au prochain tour
        enemy.lastPlan = finalPlan;
        
        // Déduit virtuellement les PA (la boucle de gameplay graphique l'animera plus tard)
        if (finalPlan.totalCost) {
            enemy.consumePA(finalPlan.totalCost);
        }
    }
}

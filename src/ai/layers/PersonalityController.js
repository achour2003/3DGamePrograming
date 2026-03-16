export class PersonalityController {
    constructor() {
        // Profils de difficulté et distribution (Niveau 1 à 5)
        // Les poids correspondent aux chances de tirer le [1er, 2ème, 3ème, 4ème] meilleur plan évalué.
        this.difficultyProfiles = {
            1: [0.25, 0.45, 0.20, 0.10], // Souvent sub-optimal, imprévisible
            2: [0.30, 0.55, 0.10, 0.05], // Raisonnable
            3: [0.50, 0.35, 0.10, 0.05], // Bon joueur, choisit souvent le meilleur plan
            4: [0.65, 0.25, 0.07, 0.03], // Expert, très peu d'erreurs
            5: [0.85, 0.10, 0.04, 0.01]  // Quasi-parfait (Boss final, Élite)
        };
    }

    /**
     * Tâche 4.1 - Tireur Probabiliste (Wheel Selection)
     * Sélectionne asymétriquement l'un des meilleurs plans selon la difficulté.
     * @param {Array<Object>} sortedPlans - Les plans préalablement classés par la Couche 2 (TacticalEvaluator)
     * @param {Object} personalityConfig - Configuration contenant le niveau de l'IA (ex: { aiLevel: 3 })
     * @returns {Object} Le plan final choisi
     */
    selectPlan(sortedPlans, personalityConfig = { aiLevel: 1 }) {
        if (!sortedPlans || sortedPlans.length === 0) {
            return { actions: [] }; // Aucun coup possible (Passer son tour)
        }

        // Récupère les poids selon le niveau d'intelligence configuré (défaut: niveau 1)
        const weights = this.difficultyProfiles[personalityConfig.aiLevel] || this.difficultyProfiles[1];

        // Extrait le top 4 des plans
        const candidates = sortedPlans.slice(0, 4);
        
        // Ajustement des poids s'il y a moins de 4 plans possibles
        // On normalise (règle de 3) pour que la somme fasse toujours 1.0 (100%)
        const availableWeights = weights.slice(0, candidates.length);
        const sumWeights = availableWeights.reduce((sum, w) => sum + w, 0);
        const normalizedWeights = availableWeights.map(w => w / sumWeights);

        // Tirage au sort façon "Roue de la fortune mathématique"
        let randomRoll = Math.random(); 
        let cumulativeWeight = 0;

        for (let i = 0; i < candidates.length; i++) {
            cumulativeWeight += normalizedWeights[i];
            if (randomRoll <= cumulativeWeight) {
                return candidates[i];
            }
        }

        // Sécurité de retour : retourne le premier plan si flottant bizarre
        return candidates[0];
    }

    /**
     * Tâche 4.2 - Gestion des Transitions de Phase du Combat
     * Vérifie si le Boss (ou Ennemi à phases) doit passer à l'étape suivante.
     * @param {Entity} entity - L'entité à scanner
     * @param {Object} bossData - Les données JSON des phases du boss (ex: Rootkit Alpha)
     */
    checkPhaseTransition(entity, bossData) {
        if (!bossData || !bossData.phases || bossData.phases.length === 0) return false;

        const hpPercent = (entity.hp / entity.maxHp) * 100;
        let phaseChanged = false;

        // Trie les phases par ordre décroissant du déclencheur HP (ex: 75% puis 50% puis 25%)
        const sortedPhases = [...bossData.phases].sort((a, b) => b.trigger_hp_percent - a.trigger_hp_percent);

        for (const phase of sortedPhases) {
            // Si la vie passe sous le seuil et que l'entité n'est pas déjà dans cette phase
            if (hpPercent <= phase.trigger_hp_percent && entity.currentPhaseId !== phase.id) {
                
                // Mettre à jour l'identifiant de phase
                entity.currentPhaseId = phase.id;
                
                // Appliquer les changements statistiques (Boost de Vit, Atk...)
                if (phase.changes && phase.changes.stats) {
                    if (phase.changes.stats.spd) entity.spd = phase.changes.stats.spd;
                    // Mettre à jour potentiellement le niveau d'intelligence et comportement
                    if (phase.changes.stats.aiLevel) {
                         entity.aiLevel = phase.changes.stats.aiLevel;
                    }
                }
                
                console.log(`[Transition] ${entity.name} entre en phase: ${phase.id} (${phase.name})`);
                phaseChanged = true;
                break; // Ne déclenche qu'une seule phase à la fois
            }
        }

        return phaseChanged;
    }

    /**
     * Tâche 4.3 - Réactions Événementielles Prioritaires (Hors Arbre IA)
     * Système anti-pattern asynchrone : si l'IA s'est fait humilier (perfect_parry), elle s'agace et réagit.
     * @param {Entity} entity 
     * @param {Object} latestEvent - Événement du contrôleur de combat (ex: { type: 'perfect_parry_received' })
     * @param {Skill} backupRevengeSkill - Le skill de substitution à forcer
     */
    overrideWithReaction(entity, latestEvent, backupRevengeSkill, enemyTarget) {
        // Ex: L'IA se fait 'Perfect Parry', au prochain tour, elle override son algorithme et frappe "Unblockable" par vengeance
        if (latestEvent.type === 'on_perfect_parry_received' && latestEvent.count >= 3) {
            
            console.warn(`[Reaction] ${entity.name} s'adapte aux Parades Parfaites ! Frappe imparable prioritaire.`);
            
            // On retourne un "Plan Manuellement Forcé"
            return {
                actions: [{
                    skill: backupRevengeSkill, 
                    target: enemyTarget
                }],
                totalCost: backupRevengeSkill.paCost || 1,
                score: 9999, // Fausse valeur affichée
                isForced: true
            };
        }

        return null;
    }
}

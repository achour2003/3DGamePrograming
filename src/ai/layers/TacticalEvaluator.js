export class TacticalEvaluator {
    constructor(config = {}) {
        this.killBonus = config.killBonus || 100;
        this.breakBonus = config.breakBonus || 80;
        this.comboBonus = config.comboBonus || 30;
    }

    /**
     * Évalue une liste entière de plans et les trie par score décroissant.
     * @param {Array<Object>} plans - Construit par la Couche 1 (ActionPlanner)
     * @param {Entity} entity - L'entité qui lance l'attaque
     * @param {Array<Object>} playerHistory - Historique du joueur pour prédiction (buffer)
     * @returns {Array<Object>} Les mêmes plans, mais triés avec leur propriété "score"
     */
    evaluatePlans(plans, entity, playerHistory = []) {
        for (const plan of plans) {
            plan.score = this._scorePlan(plan, entity, playerHistory);
        }
        
        // Tri décroissant du meilleur score au pire
        plans.sort((a, b) => b.score - a.score);
        return plans;
    }

    /**
     * Moteur de scoring factoriel d'un seul plan de jeu
     */
    _scorePlan(plan, entity, playerHistory) {
        if (!plan.actions || plan.actions.length === 0) return 0; // Plan vide = 0

        let totalScore = 0;

        // --- 1. Scoring des actions individuelles ---
        for (const action of plan.actions) {
            totalScore += this._estimateDamageScore(action, entity);
            totalScore += this._scoreEffects(action);
        }

        // --- 2. Scoring de synergie (Combos d'actions) ---
        totalScore += this._evaluateCombos(plan);

        // --- 3. Prédiction du joueur (Minimax partiel) ---
        totalScore += this._applyPlayerPrediction(plan, playerHistory);

        // --- 4. Pénalité de répétition (Robot imprévisible) ---
        totalScore -= this._applyPatternPenalty(plan, entity);

        // Ajoute un léger facteur "Variance" (comme défini dans le Technique Guide d'origine) pour casser l'égalité parfaite
        totalScore += Math.random() * 10;

        return totalScore;
    }

    /**
     * Tâche 3.1 - Scoring Analytique : Dégâts et Stabilité (Rupture)
     */
    _estimateDamageScore(action, attacker) {
        const { skill, target } = action;
        
        // Ignore le calcul de dommage si c'est un soin / buff ou pas une cible directe
        if (target === 'all_enemies' || skill.power === 0) return 0;
        // On contourne momentanément la complexité de soi-même
        if (target.id && target.id === attacker.id) return 0;

        let damageScore = 0;

        // Récupération dynamique (si Entity) des stats
        const effectiveAtk = attacker.getEffAtk ? attacker.getEffAtk() : attacker.atk || 10;
        const effectiveDef = target.getEffDef ? target.getEffDef() : target.def || 10;

        // Formule de dégâts formelle
        let baseDamage = (skill.power * effectiveAtk) / Math.max(1, effectiveDef);

        // Multiplicateur de Faiblesse
        if (target.getWeaknessMultiplier) {
            baseDamage *= target.getWeaknessMultiplier(skill.damageType || 'physical');
        }

        // Le score de dégâts de base (30% du dégât escompté selon guide)
        damageScore += baseDamage * 0.3;

        // Calcul de l'élimination (One/Shot target bonus massif)
        if (baseDamage >= target.hp) {
            damageScore += this.killBonus; // +100
        } else if (baseDamage >= target.hp * 0.5) {
            damageScore += 50; // Massif dégât
        }

        // Dégâts sur la Stabilité
        if (skill.breakDamage && target.breakGauge !== undefined) {
            if (target.breakGauge + skill.breakDamage >= target.maxBreak) {
                // Énorme bonus si le plan d'action déclenche l'état "Break" 
                damageScore += this.breakBonus;
            } else {
                damageScore += skill.breakDamage * 0.5;
            }
        }

        return damageScore;
    }

    /**
     * Tâche 3.2 - Scoring d'Effets (Heuristiques)
     */
    _scoreEffects(action) {
        let effectScore = 0;
        const tags = action.skill.comboTags || [];
        
        if (tags.includes('stun')) effectScore += 35;
        if (tags.includes('purge_buff')) effectScore += 20;
        if (tags.includes('steal_pa')) effectScore += 25;
        if (tags.includes('buff')) effectScore += 15;

        return effectScore;
    }

    /**
     * Tâche 3.2 (suite) - Combo Stratégiques au sein du même plan
     */
    _evaluateCombos(plan) {
        let comboScore = 0;
        // Extrait un tableau global de tous les tags du tour en cours
        const tags = plan.actions.map(a => a.skill.comboTags).flat();

        // Si l'IA prépare avec un Opener puis enchaine un Follow Up
        if (tags.includes('opener') && tags.includes('follow_up')) {
            comboScore += this.comboBonus;
        }
        
        // Pression temporelle
        if (tags.includes('dot') && tags.includes('pressure')) {
            comboScore += 20;
        }

        // Burst contrôlé
        if (tags.includes('control') && tags.includes('burst')) {
            comboScore += 35; // Maximise le contrôle puis frappe fort
        }

        return comboScore;
    }

    /**
     * Tâche 3.3 - Prédiction Joueur (Adaptation Minimax)
     */
    _applyPlayerPrediction(plan, playerHistory) {
        if (!playerHistory || playerHistory.length === 0) return 0;
        
        let predictionScore = 0;
        const tags = plan.actions.map(a => a.skill.comboTags).flat();

        // Analyser les tendances du joueur sur les 3 derniers tours
        let attackCount = 0;
        let defenseCount = 0;

        const recentHistory = playerHistory.slice(-3);
        const total = recentHistory.length;

        for (const actionInfo of recentHistory) {
            if (actionInfo.type === 'attack') attackCount++;
            if (actionInfo.type === 'defend' || actionInfo.type === 'heal') defenseCount++;
        }

        const isAggressive = (attackCount / total) >= 0.6;
        const isDefensive = (defenseCount / total) >= 0.6;

        // Le joueur attaque 80% du temps ? Bonus aux actions "Buff Def" de l'ennemi.
        if (isAggressive && tags.includes('buff_def')) {
            predictionScore += 40;
        }
        // Le joueur pare / se cache souvent ? Bonus aux frappes imparables.
        if (isDefensive && tags.includes('unblockable')) {
            predictionScore += 40; 
        }

        return predictionScore;
    }

    /**
     * Tâche 3.3 (suite) - Malus Anti-Boucle (Imprévisibilité)
     */
    _applyPatternPenalty(plan, entity) {
        if (!entity.lastPlan || !entity.lastPlan.actions) return 0;

        // On crée une signature du plan sous forme de chaîne (Ex: "skill_1-skill_2")
        const currentSignature = plan.actions.map(a => a.skill.id).join('-');
        const lastSignature = entity.lastPlan.actions.map(a => a.skill.id).join('-');

        if (currentSignature === lastSignature) {
            // L'IA perd gravement des points si elle rejoue un pattern récent
            return 40; 
        }

        return 0;
    }
}

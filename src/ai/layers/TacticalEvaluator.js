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
     * @param {Object} gameState - État global (ex: { playerParty: [...] }) pour Utility AI
     * @returns {Array<Object>} Les mêmes plans, mais triés avec leur propriété "score"
     */
    evaluatePlans(plans, entity, playerHistory = [], gameState = {}) {
        const utilityRules = entity.utility_rules || [];

        for (const plan of plans) {
            // Évaluation tactique de base (scoring dégâts)
            plan.score = this._scorePlan(plan, entity, playerHistory);
            
            // Surcharge via Utility AI ("Règles d'Urgence absolues")
            if (utilityRules.length > 0) {
                const utilityScore = this.evaluateUtilityRules(entity, gameState, plan, utilityRules);
                if (utilityScore > 0) {
                    plan.score = utilityScore; // Écrase totalement l'évaluation standard
                }
            }
        }
        
        // Tri décroissant du meilleur score au pire
        plans.sort((a, b) => b.score - a.score);
        return plans;
    }

    /**
     * Tâche 2.2 - Moteur de Règles d'Utilité (Utility AI)
     * Évalue si le plan courant contient l'action imposée par une règle d'urgence
     */
    evaluateUtilityRules(entity, gameState, plan, rules) {
        for (const rule of rules) {
            if (this._isRuleConditionMet(rule.condition, entity, gameState)) {
                // Règle valide. On vérifie si ce plan contient l'action imposée
                const [actionType, actionId] = rule.action.split(':');
                
                for (const act of plan.actions) {
                    // Si le plan contient le skill ou l'item attendu
                    if ((actionType === 'skill' || actionType === 'use_item') && act.skill.id === actionId) {
                        return rule.priority;
                    }
                }
            }
        }
        return 0; // Aucune règle applicable à ce plan
    }

    /**
     * Parse et valide une condition string d'Utility AI
     * Ex: "self.hp_percent < 0.3" ou "target.pa >= 5"
     */
    _isRuleConditionMet(conditionString, entity, gameState) {
        const parts = conditionString.split(' ');
        if (parts.length >= 3) {
            const variable = parts[0];
            const operator = parts[1];
            const value = parseFloat(parts[2]);
            
            let currentVal = 0;
            
            if (variable === 'self.hp_percent') {
                currentVal = entity.hp / entity.maxHp;
            } else if (variable === 'target.pa') {
                const target = gameState.playerParty && gameState.playerParty[0] ? gameState.playerParty[0] : null;
                if (target) currentVal = target.pa;
                else return false;
            } else if (variable === 'self.pa') {
                currentVal = entity.pa;
            }
            
            switch (operator) {
                case '<': return currentVal < value;
                case '<=': return currentVal <= value;
                case '>': return currentVal > value;
                case '>=': return currentVal >= value;
                case '===': return currentVal === value;
                case '==': return currentVal == value;
            }
        }
        return false;
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
        const { skill, target, spentPA } = action;
        
        // Ignore le calcul de dommage si c'est un soin / buff ou pas une cible directe
        if (target === 'all_enemies' || skill.power === 0) return 0;
        // On contourne momentanément la complexité de soi-même
        if (target.id && target.id === attacker.id) return 0;

        let damageScore = 0;

        // Récupération dynamique (si Entity) des stats
        const effectiveAtk = attacker.getEffAtk ? attacker.getEffAtk() : attacker.atk || 10;
        const effectiveDef = target.getEffDef ? target.getEffDef() : target.def || 10;
        
        // Calcule la puissance réelle en cas d'attaque proportionnelle (costType: 'all')
        const realPower = skill.calculatePower ? skill.calculatePower(spentPA || skill.paCost) : skill.power;

        // Formule de dégâts formelle
        let baseDamage = (realPower * effectiveAtk) / Math.max(1, effectiveDef);

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

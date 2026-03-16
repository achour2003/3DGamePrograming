export class ActionPlanner {
    constructor(config = {}) {
        // Tache 2.1 : Sécurité anti-crash
        this.maxDepth = config.maxDepth || 3; // Profondeur max : 3 actions par tour
        this.maxPlans = config.maxPlans || 500; // Cap fixe de sécurité
    }

    /**
     * Génère tous les plans d'actions légaux pour un tour donné.
     * @param {Entity} entity - L'entité en train de jouer
     * @param {Array<Skill>} availableSkills - Liste des capacités de l'entité
     * @param {Array<Entity>} enemies - Les cibles adverses (ex: Elior, Mira)
     * @param {Array<Entity>} allies - Les alliés (incluant l'entité elle-même)
     * @returns {Array<Object>} Un tableau contenant tous les plans possibles.
     */
    generatePlans(entity, availableSkills, enemies, allies) {
        const plans = [];
        const initialPlan = { actions: [], totalCost: 0 };
        
        // On ajoute toujours la possibilité de ne rien faire ou s'arrêter là
        plans.push(initialPlan);

        this._enumerate(entity, availableSkills, enemies, allies, initialPlan, plans);

        return plans;
    }

    /**
     * Tache 2.1 - Implémentation du moteur de parcours combinatoire (_enumerate)
     * Fonction récursive (Backtracking / Sac à dos)
     */
    _enumerate(entity, availableSkills, enemies, allies, currentPlan, plans) {
        // Sécurités pour préserver les performances
        if (plans.length >= this.maxPlans) return;
        if (currentPlan.actions.length >= this.maxDepth) return;

        for (const skill of availableSkills) {
            // Contrainte de PA (Budget global du tour)
            if (currentPlan.totalCost + skill.paCost > entity.pa) continue;
            
            // Tache 2.2 - Contrainte de Cooldown (Native)
            if (!skill.isUsable(entity)) continue;

            // Tache 2.2 - Vérification des règles de contraintes (Empilement, etc.)
            if (this._violatesConstraints(skill, currentPlan)) continue;

            // Tache 2.3 - Résolution des cibles logiques
            const targets = this._resolveTargets(skill, enemies, allies, entity);

            for (const target of targets) {
                // Instanciation de la nouvelle branche de plan
                const nextPlan = {
                    actions: [...currentPlan.actions, { skill, target }],
                    totalCost: currentPlan.totalCost + skill.paCost
                };

                plans.push(nextPlan);

                // Appel récursif pour voir si on peut rajouter des actions avec les PA restants
                this._enumerate(entity, availableSkills, enemies, allies, nextPlan, plans);
            }
        }
    }

    /**
     * Tache 2.2 - Programmation des Contraintes dures.
     * Vérifie les règles spéciales qui bloquent une action.
     */
    _violatesConstraints(skill, currentPlan) {
        for (const action of currentPlan.actions) {
            // Règle: Bloquer l'usage multiple du même auto-buff dans le même tour.
            if (action.skill.id === skill.id && skill.comboTags.includes('buff')) {
                return true; 
            }
            
            // Règle: Empêcher de spammer exactement la même compétence si elle a la contrainte 'no_repeat' (JSON externe)
            if (action.skill.id === skill.id && skill.comboTags.includes('no_repeat')) {
                return true;
            }
        }
        return false;
    }

    /**
     * Tache 2.3 - Résolution des cibles logiques.
     * Décline le plan selon les cibles légales.
     */
    _resolveTargets(skill, enemies, allies, self) {
        const targets = [];
        
        switch (skill.targetType) {
            case 'self':
                targets.push(self);
                break;

            case 'aoe':
                // Cible symbolique de groupe ("tous les ennemis"), l'Evaluateur comprendra
                targets.push('all_enemies'); 
                break;

            case 'single':
                // Si la compétence est un soin/buff (support), on cible un allié, sinon un ennemi
                const isSupport = skill.comboTags.includes('support') || skill.comboTags.includes('heal');
                const validTargets = isSupport ? allies : enemies;
                
                for (const t of validTargets) {
                    if (t.isAlive()) {
                        targets.push(t);
                    }
                }
                break;
        }

        return targets;
    }
}

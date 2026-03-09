/**
 * ====== PROGRESSION SYSTEM ======
 * Gère les Fragments de Code et l'arbre de compétences
 */

class ProgressionSystem {
    constructor() {
        this.fragments = 0;
        this.unlockedSkills = new Set();
        this.skillTree = this.initializeSkillTree();
        this.loadFromLocalStorage();
    }

    /**
     * Initialise l'arbre de compétences
     */
    initializeSkillTree() {
        return {
            // ========== COMBAT (4 compétences) ==========
            SKILL_ATTACK_ELECTRIC: {
                name: 'Attaque Électrique',
                type: 'combat',
                cost: 20,
                level: 1,
                description: 'Attaque physique renforcée. Dégâts x1.5',
                icon: '⚡',
                effect: 'damage_multiplier',
                value: 1.5,
                prerequisites: []
            },
            SKILL_CHARGE: {
                name: 'Surcharge Système',
                type: 'combat',
                cost: 35,
                level: 2,
                description: 'Attaque puissante contre un ennemi. Dégâts x2.0',
                icon: '💥',
                effect: 'damage_multiplier',
                value: 2.0,
                prerequisites: ['SKILL_ATTACK_ELECTRIC']
            },
            SKILL_CASCADE: {
                name: 'Attaque en Cascades',
                type: 'combat',
                cost: 50,
                level: 3,
                description: 'Enchaîner les coups. Attaque 2 ennemis simultanément 1.3x',
                icon: '🔄',
                effect: 'multi_attack',
                value: 2,
                prerequisites: ['SKILL_CHARGE']
            },
            SKILL_DEFENSIVE_STANCE: {
                name: 'Posture Défensive',
                type: 'combat',
                cost: 15,
                level: 1,
                description: 'Défense renforcée. Réduit dégâts de 60% pendant 2 tours',
                icon: '🛡️',
                effect: 'defense_boost',
                value: 0.4,
                prerequisites: []
            },

            // ========== HACKING (3 compétences) ==========
            SKILL_HACK_BASIC: {
                name: 'Piratage Basique',
                type: 'hacking',
                cost: 25,
                level: 1,
                description: 'Pirater un ennemi converti avec un mini-puzzle',
                icon: '🔓',
                effect: 'hack_basic',
                value: 1,
                prerequisites: []
            },
            SKILL_HACK_SILENT: {
                name: 'Piratage Silencieux',
                type: 'hacking',
                cost: 40,
                level: 2,
                description: 'Piratage plus difficile mais sans alerter ARIA. +30% succès',
                icon: '🤫',
                effect: 'hack_silent',
                value: 1.3,
                prerequisites: ['SKILL_HACK_BASIC']
            },
            SKILL_HACK_MASS: {
                name: 'Piratage de Masse',
                type: 'hacking',
                cost: 60,
                level: 3,
                description: 'Pirater jusqu\'à 3 ennemis simultanément (difficile)',
                icon: '🌐',
                effect: 'hack_mass',
                value: 3,
                prerequisites: ['SKILL_HACK_SILENT']
            },

            // ========== ANALYSE (3 compétences) ==========
            SKILL_SCAN_HEALTH: {
                name: 'Scan des HP',
                type: 'analyse',
                cost: 20,
                level: 1,
                description: 'Voir les HP exacts de tous les ennemis',
                icon: '👁️',
                effect: 'scan_health',
                value: 1,
                prerequisites: []
            },
            SKILL_VULNERABILITY_ANALYSIS: {
                name: 'Analyse de Vulnérabilité',
                type: 'analyse',
                cost: 45,
                level: 2,
                description: 'Voir les faiblesses et résistances des ennemis',
                icon: '🔍',
                effect: 'scan_weakness',
                value: 1,
                prerequisites: ['SKILL_SCAN_HEALTH']
            },
            SKILL_PREDICT_MOVE: {
                name: 'Prédiction d\'IA',
                type: 'analyse',
                cost: 55,
                level: 3,
                description: 'Voir le prochain move de l\'ennemi avant qu\'il joue',
                icon: '🔮',
                effect: 'predict_next_move',
                value: 1,
                prerequisites: ['SKILL_VULNERABILITY_ANALYSIS']
            }
        };
    }

    /**
     * Ajoute des fragments au compte
     */
    addFragments(amount) {
        this.fragments += amount;
        console.log(`💎 +${amount} Fragments! Total: ${this.fragments}`);
        this.updateUI();
    }

    /**
     * Déduit des fragments
     */
    spendFragments(amount) {
        if (this.fragments >= amount) {
            this.fragments -= amount;
            console.log(`💎 -${amount} Fragments spent. Remaining: ${this.fragments}`);
            return true;
        } else {
            console.warn(`❌ Not enough Fragments! Need ${amount}, have ${this.fragments}`);
            return false;
        }
    }

    /**
     * Déverrouille une compétence
     */
    unlockSkill(skillId) {
        const skill = this.skillTree[skillId];

        if (!skill) {
            console.error('❌ Skill not found:', skillId);
            return false;
        }

        if (this.unlockedSkills.has(skillId)) {
            console.warn('⚠️ Skill already unlocked!');
            return false;
        }

        // Vérifier les prérequis
        if (skill.prerequisites.length > 0) {
            const hasPrerequisites = skill.prerequisites.every(prereq => this.unlockedSkills.has(prereq));
            if (!hasPrerequisites) {
                console.warn('⚠️ Prerequisites not met:', skill.prerequisites);
                return false;
            }
        }

        // Vérifier les fragments
        if (!this.spendFragments(skill.cost)) {
            return false;
        }

        this.unlockedSkills.add(skillId);
        console.log(`✅ Skill unlocked: ${skill.name}`);
        this.updateUI();
        return true;
    }

    /**
     * Vérifie si une compétence est déverrouillée
     */
    hasSkill(skillId) {
        return this.unlockedSkills.has(skillId);
    }

    /**
     * Retourne les détails d'une compétence
     */
    getSkill(skillId) {
        return this.skillTree[skillId] || null;
    }

    /**
     * Retourne toutes les compétences déverrouillées
     */
    getUnlockedSkills() {
        return Array.from(this.unlockedSkills).map(skillId => ({
            id: skillId,
            ...this.skillTree[skillId]
        }));
    }

    /**
     * Retourne les compétences disponibles pour déblocage (avec prérequis satisfaits)
     */
    getAvailableSkills() {
        const available = [];

        for (const [skillId, skill] of Object.entries(this.skillTree)) {
            if (this.unlockedSkills.has(skillId)) continue; // Déjà déverrouillée

            // Vérifier les prérequis
            const prereqsMet = skill.prerequisites.length === 0 || 
                              skill.prerequisites.every(p => this.unlockedSkills.has(p));

            available.push({
                id: skillId,
                ...skill,
                isAvailable: prereqsMet,
                canAfford: this.fragments >= skill.cost
            });
        }

        return available;
    }

    /**
     * Retourne les statistiques de progression
     */
    getProgressionStats() {
        const total = Object.keys(this.skillTree).length;
        const unlocked = this.unlockedSkills.size;
        const locked = total - unlocked;

        return {
            fragments: this.fragments,
            skillsUnlocked: unlocked,
            skillsLocked: locked,
            totalSkills: total,
            progressPercent: ((unlocked / total) * 100).toFixed(1)
        };
    }

    /**
     * Met à jour l'UI (fragment counter, skill buttons)
     */
    updateUI() {
        // Mettre à jour le compteur de fragments s'il existe
        const fragmentDisplay = document.getElementById('fragment-count');
        if (fragmentDisplay) {
            fragmentDisplay.textContent = this.fragments;
        }

        // Mettre à jour les boutons de déblocage si le menu est ouvert
        const skillButtons = document.querySelectorAll('[data-skill-id]');
        skillButtons.forEach(btn => {
            const skillId = btn.dataset.skillId;
            const skill = this.skillTree[skillId];
            const isUnlocked = this.unlockedSkills.has(skillId);
            const canAfford = this.fragments >= skill.cost;

            if (isUnlocked) {
                btn.classList.add('skill-unlocked');
                btn.classList.remove('skill-locked');
                btn.disabled = true;
            } else {
                btn.classList.add('skill-locked');
                btn.classList.remove('skill-unlocked');
                btn.disabled = !canAfford;
            }
        });

        // Sauvegarder
        this.saveToLocalStorage();
    }

    /**
     * Sauvegarde le système localement
     */
    saveToLocalStorage() {
        const data = {
            fragments: this.fragments,
            unlockedSkills: Array.from(this.unlockedSkills)
        };
        localStorage.setItem('progression_data', JSON.stringify(data));
    }

    /**
     * Charge le système depuis le localStorage
     */
    loadFromLocalStorage() {
        const data = localStorage.getItem('progression_data');
        if (data) {
            const parsed = JSON.parse(data);
            this.fragments = parsed.fragments || 0;
            this.unlockedSkills = new Set(parsed.unlockedSkills || []);
            console.log('📦 Progression loaded from localStorage');
        }
    }

    /**
     * Remet le système à zéro
     */
    reset() {
        this.fragments = 0;
        this.unlockedSkills.clear();
        localStorage.removeItem('progression_data');
        console.log('🔄 Progression reset');
    }
}

// Export
const progressionSystem = new ProgressionSystem();

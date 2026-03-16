export class Skill {
    constructor(data) {
        this.id = data.id || 'unknown_skill';
        this.name = data.name || this.id;
        
        // --- Coûts et Base ---
        this.paCost = data.paCost || 1;
        this.power = data.power || 0;
        this.targetType = data.targetType || 'single'; // single, aoe, self
        
        // --- Système de Combo / IA ---
        // Ex: ['opener', 'follow_up', 'finisher', 'dot', 'control']
        this.comboTags = data.comboTags || [];
        
        // --- Cooldowns ---
        this.maxCd = data.maxCd || 0;
        this.currentCd = data.currentCd || 0; // Se tick chaque tour
        
        // --- Mécaniques Avancées / Interruptions ---
        this.interruptible = data.interruptible ?? true;
        this.telegraphDuration = data.telegraphDuration || 0; // ms
        
        // --- Effets appliqués par la compétence ---
        this.effects = data.effects || []; 
    }

    /**
     * Vérifie si la compétence est utilisable par l'entité (Cooldowns & PA)
     * @param {Entity} caster 
     */
    isUsable(caster) {
        if (this.currentCd > 0) return false;
        if (caster.pa < this.paCost) return false;
        return true;
    }

    /**
     * Met à jour le Cooldown de la compétence
     */
    tickCooldown() {
        if (this.currentCd > 0) {
            this.currentCd--;
        }
    }

    /**
     * Lance le cooldown après utilisation
     */
    startCooldown() {
        this.currentCd = this.maxCd;
    }
}

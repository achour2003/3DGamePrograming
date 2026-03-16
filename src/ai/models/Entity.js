export class Entity {
    constructor(config) {
        this.id = config.id || 'unknown';
        this.name = config.name || 'Unnamed Entity';
        
        // --- Statistiques de base ---
        this.maxHp = config.maxHp || 100;
        this.hp = config.hp || this.maxHp;
        this.atk = config.atk || 10;
        this.def = config.def || 10;
        this.spd = config.spd || 10;

        // --- Gestion des PA (Points d'Action) ---
        this.maxPa = config.maxPa || 5;
        this.pa = config.pa || this.maxPa;
        this.paRegen = config.paRegen || 3; // PA récupérés par tour

        // --- Jauge de Rupture (Break / Stability) ---
        this.breakGauge = config.breakGauge || 0;
        this.maxBreak = config.maxBreak || 100;

        // --- Faiblesses et Résistances (Modificateurs) ---
        // Ex: { "fire": 1.5, "ice": 0.5, "hack": 2.0 }
        this.weaknesses = config.weaknesses || {}; 
        this.resistances = config.resistances || {};
        this.weakpoints = config.weakpoints || [];

        // --- Statuts et Effets ---
        this.statusEffects = [];

        // --- Historique des actions (Buffer pour IA adaptative) ---
        this.actionHistory = [];
        this.maxHistorySize = config.maxHistorySize || 10;
    }

    // ==========================================
    // MÉTHODES DE CYCLE DE VIE DE COMBAT
    // ==========================================

    isAlive() {
        return this.hp > 0;
    }

    isBroken() {
        return this.breakGauge >= this.maxBreak;
    }

    // Restaure un montant défini de PA (souvent au début du tour)
    regeneratePA() {
        this.pa = Math.min(this.maxPa, this.pa + this.paRegen);
    }

    // Dépense des PA si possible
    consumePA(amount) {
        if (this.pa >= amount) {
            this.pa -= amount;
            return true;
        }
        return false;
    }

    // ==========================================
    // CALCULS DE DÉGÂTS ET MODIFICATEURS
    // ==========================================

    getEffDef() {
        let modifier = 1.0;
        // On vérifie les altérations de statut qui modifient la DEF
        for (const s of this.statusEffects) {
            if (s.stat === 'def') modifier *= s.modifier;
        }
        // Si l'entité est en rupture, la défense est souvent ignorée ou réduite massivement
        if (this.isBroken()) {
            modifier *= 0.2; // La défense chute à 20% en Break
        }
        return Math.max(0, this.def * modifier);
    }

    getEffAtk() {
        let modifier = 1.0;
        for (const s of this.statusEffects) {
            if (s.stat === 'atk') modifier *= s.modifier;
        }
        return Math.max(0, this.atk * modifier);
    }

    getWeaknessMultiplier(attackType) {
        let multiplier = 1.0;
        if (this.weaknesses[attackType]) {
            multiplier *= this.weaknesses[attackType];
        }
        if (this.resistances[attackType]) {
            multiplier *= this.resistances[attackType];
        }
        return multiplier;
    }

    // ==========================================
    // APPLICATIONS
    // ==========================================

    applyDamage(amount) {
        this.hp = Math.max(0, this.hp - Math.round(amount));     
    }

    applyBreak(amount) {
        if (!this.isBroken()) {
            this.breakGauge = Math.min(this.maxBreak, this.breakGauge + amount);
        }
    }

    recoverBreak(amount) {
        this.breakGauge = Math.max(0, this.breakGauge - amount);
    }

    // ==========================================
    // GESTION DES EFFETS DE STATUT (Status Effects)
    // ==========================================

    addStatusEffect(effect) {
        // effect ex: { id: 'poison', type: 'dot', duration: 3, value: 5, stat: null, modifier: 1 }
        this.statusEffects.push({ ...effect });
    }

    tickStatuses() {
        for (let i = this.statusEffects.length - 1; i >= 0; i--) {
            const s = this.statusEffects[i];
            
            // Appliquer les effets périodiques (Damage Over Time / Heal Over Time)
            if (s.type === 'dot') {
                this.applyDamage(s.value);
            } else if (s.type === 'hot') {
                this.hp = Math.min(this.maxHp, this.hp + s.value);
            }

            // Réduire la durée
            s.duration--;

            // Si expiré, le retirer
            if (s.duration <= 0) {
                this.statusEffects.splice(i, 1);
            }
        }
    }

    // ==========================================
    // GESTION DE L'HISTORIQUE
    // ==========================================

    logAction(actionData) {
        this.actionHistory.push(actionData);
        if (this.actionHistory.length > this.maxHistorySize) {
            this.actionHistory.shift(); // Garde seulement les N dernières actions
        }
    }
}

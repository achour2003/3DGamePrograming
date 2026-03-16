import { Entity } from './models/Entity.js';
import { Skill } from './models/Skill.js';

export class EnemyFactory {
    /**
     * Tâche 5.1 - Implémentation Factory & Structure JSON
     * Dictionnaire (JSON) vers Instance technique (Entity)
     */
    static fromJSON(config) {
        // Mapping de base vers l'entité
        const enemy = new Entity({
            id: config.id,
            name: config.name,
            
            // Statistiques
            maxHp: config.stats?.hp || 100,
            hp: config.stats?.hp || 100,
            atk: config.stats?.atk || 10,
            def: config.stats?.def || 10,
            spd: config.stats?.spd || 10,
            
            // Points d'Actions et Break (Rupture) issus du document AI_ARCHITECTURE
            maxPa: config.max_pa || 5,
            pa: config.max_pa || 5, // On démarre full PA
            
            breakGauge: 0,
            maxBreak: config.stability_max || 100,
            
            // Faiblesses
            weaknesses: config.weaknesses || {},
            resistances: config.resistances || {},
            weakpoints: config.weakpoints || []
        });

        // Mapping des configurations IA spécifiques
        enemy.aiLevel = config.ai_level || 1;
        enemy.phasesData = config.phases || []; 
        enemy.currentPhaseId = config.phases && config.phases.length > 0 ? config.phases[0].id : null;

        // Construction et assignation des Skills (Capacités)
        enemy.skills = [];
        if (config.skills && Array.isArray(config.skills)) {
            for (const skillData of config.skills) {
                enemy.skills.push(new Skill(skillData));
            }
        }

        return enemy;
    }
}

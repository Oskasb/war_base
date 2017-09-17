
"use strict";


define([],
    function() {


        var CombatStatus = function(combatStats) {

            this.max_health = combatStats.health;
            this.max_armor = combatStats.armor;

            this.health = this.max_health;
            this.armor = this.max_armor;
        };

        CombatStatus.prototype.getMaxHealth = function() {
            return this.max_health;
        };

        CombatStatus.prototype.getMaxArmor = function() {
            return this.max_armor;
        };

        CombatStatus.prototype.getHealth = function() {
            return this.health;
        };

        CombatStatus.prototype.getArmor = function() {
            return this.armor;
        };


        return CombatStatus
    });
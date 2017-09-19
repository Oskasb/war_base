
"use strict";


define([],
    function() {

        var CombatStatus = function(combatStats) {

            this.setMaxHealth(combatStats.health);
            this.setMaxArmor(combatStats.armor);
            this.setHealth(this.getMaxHealth());
            this.setArmor(this.getMaxArmor());
            this.setCombatState(ENUMS.CombatStates.NONE);
        };

        CombatStatus.prototype.setMaxHealth = function(value) {
            this.max_health = value;
        };

        CombatStatus.prototype.getMaxHealth = function() {
            return this.max_health;
        };

        CombatStatus.prototype.setMaxArmor = function(value) {
            this.max_armor = value;
        };

        CombatStatus.prototype.getMaxArmor = function() {
            return this.max_armor;
        };

        CombatStatus.prototype.setHealth = function(value) {
            this.health = value;
        };

        CombatStatus.prototype.getHealth = function() {
            return this.health;
        };

        CombatStatus.prototype.setArmor = function(value) {
            this.armor = value;
        };

        CombatStatus.prototype.getArmor = function() {
            return this.armor;
        };

        CombatStatus.prototype.setCombatState = function(state) {
            this.combatState = state;
        };

        CombatStatus.prototype.notifySelectedActivation = function() {
            this.setCombatState(ENUMS.CombatStates.ENGAGED);
        };

        CombatStatus.prototype.notifyActivationDeactivate = function() {
            this.setCombatState(ENUMS.CombatStates.NONE);
        };

        CombatStatus.prototype.getCombatState = function() {
            return this.combatState;
        };

        return CombatStatus
    });
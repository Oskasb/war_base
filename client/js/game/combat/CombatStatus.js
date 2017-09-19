
"use strict";


define([],
    function() {

        var CombatStatus = function(combatStats) {

            this.initHealth = combatStats.health;
            this.initArmor = combatStats.armor;
            this.setMaxHealth(this.initHealth);
            this.setMaxArmor(this.initArmor);
            this.setHealth(this.getMaxHealth());
            this.setArmor(this.getMaxArmor());
            this.setCombatState(ENUMS.CombatStates.NONE);

            this.dynamic = {
                combat_state:     {state:0},
                max_health:       {state:0},
                max_armor:        {state:0},
                health:           {state:0},
                armor:            {state:0}
            };

        };

        CombatStatus.prototype.setDynamic = function(key, value) {
            this.dynamic[key].state = value;
        };

        CombatStatus.prototype.getDynamic = function(key) {
            return this.dynamic[key].state;
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
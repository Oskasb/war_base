
"use strict";


define([],
    function() {




        var CombatStatus = function(combatStats) {

            this.max_health = combatStats.health;
            this.max_armor = combatStats.armor;

            this.health = this.max_health;
            this.armor = this.max_armor;

            this.combatState = ENUMS.CombatStates.IDLE;
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

        CombatStatus.prototype.setCombatState = function(state) {
            this.combatState = state;
        };

        CombatStatus.prototype.notifySelectedActivation = function() {
            this.setCombatState(ENUMS.CombatStates.ENGAGED);
        };

        CombatStatus.prototype.notifyActivationDeactivate = function() {
            this.setCombatState(ENUMS.CombatStates.IDLE);
        };

        CombatStatus.prototype.getCombatState = function() {
            if (Math.random() < 0.001) {
                this.setCombatState(ENUMS.CombatStates.ENGAGING);

                if (Math.random() < 0.2) {
                    this.health -= 1;

                    if (this.health === 0) this.health = this.max_health;
                }
            }

            if (Math.random() < 0.02) {
                this.health -= 1;

                if (this.health === 0) this.health = this.max_health;
            }

            if (Math.random() < 0.005 && this.combatState === ENUMS.CombatStates.ENGAGING) {
                this.setCombatState(ENUMS.CombatStates.IDLE);
            }

            return this.combatState;
        };



        return CombatStatus
    });
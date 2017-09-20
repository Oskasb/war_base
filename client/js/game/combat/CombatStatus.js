
"use strict";


define([],
    function() {

        var CombatStatus = function(combatStats) {

            this.initHealth = combatStats.health;
            this.initArmor = combatStats.armor;

            this.dirty = false;

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
            this.health = MATH.clamp(value, 0, this.getMaxHealth());
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

        CombatStatus.prototype.applyHitValues = function(baseDamage, armorPenetration, armorShred) {



            var mitigation = MATH.clamp(this.getArmor() - armorPenetration, 0, this.getArmor());

            var deductDmg =  MATH.clamp(baseDamage - mitigation, 0, baseDamage);

            this.setHealth(this.getHealth() - deductDmg);

            this.setArmor(MATH.clamp(this.getArmor() - armorShred, 0, this.getArmor()));

            if (deductDmg < 0 || armorShred) {
                this.notifyDamageTaken();
            } else {
                this.notifyAttackMitigated();
            }

            if (this.getHealth() <= 0 ) {
                this.notifyZeroHealth(deductDmg);
            }

            this.dirty = true;
        };


        CombatStatus.prototype.notifySelectedActivation = function() {
            this.dirty = true;
            if (this.getCombatState() < ENUMS.CombatStates.THREATENED) {
                this.setCombatState(ENUMS.CombatStates.THREATENED);
            }
        };

        CombatStatus.prototype.notifyAttackMitigated = function() {
            if (this.getCombatState() < ENUMS.CombatStates.ENGAGING) {
                this.setCombatState(ENUMS.CombatStates.ENGAGING);
            }
        };

        CombatStatus.prototype.notifyDamageTaken = function() {
            if (this.getCombatState() < ENUMS.CombatStates.ENGAGED) {
                this.setCombatState(ENUMS.CombatStates.ENGAGED);
            }
        };

        CombatStatus.prototype.notifyZeroHealth = function(deductDmg) {
            if (this.getCombatState() < ENUMS.CombatStates.DISABLED) {
                this.setCombatState(ENUMS.CombatStates.DISABLED);
                return;
            }

            if (this.getCombatState() < ENUMS.CombatStates.DESTROYED) {
                if (Math.random() *(this.getMaxArmor() + this.getMaxHealth()) < deductDmg) {
                    this.setCombatState(ENUMS.CombatStates.DESTROYED);
                }
                return;
            }

            if (this.getCombatState() < ENUMS.CombatStates.KILLED) {
                if (Math.random() * (this.getMaxArmor() + this.getMaxHealth()) < deductDmg) {
                    this.setCombatState(ENUMS.CombatStates.KILLED);
                }
            }
        };

        CombatStatus.prototype.notifyActivationDeactivate = function() {
            if (this.getCombatState() <= ENUMS.CombatStates.THREATENED) {
                this.setCombatState(ENUMS.CombatStates.NONE);
            }
        };

        CombatStatus.prototype.getCombatState = function() {
            return this.combatState;
        };

        return CombatStatus
    });
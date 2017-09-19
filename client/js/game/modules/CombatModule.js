
"use strict";


define([
        'PipelineObject'
    ],
    function(
        PipelineObject
    ) {

        var CombatModule = function(dataKey, ready, index) {

            this.index = index;

            this.dataKey = dataKey;

            this.dynamic = {
                combatState:     {state:0},
                maxHealth:       {state:0},
                maxArmor:        {state:0},
                health:          {state:0},
                armor:           {state:0}
            };

            var applyChannelData = function() {
                this.applyData(this.pipeObj.buildConfig()[this.dataKey]);
                ready(this);
            }.bind(this);

            this.pipeObj = new PipelineObject('COMBAT_DATA', 'COMBAT_MODELS', applyChannelData, this.dataKey);
        };

        CombatModule.prototype.applyData = function (config) {
            this.config = config;
            this.feedbackMap = config.feedback_map;
        };

        CombatModule.prototype.applyCombatStatus = function (combatStatus) {
            this.dynamic.combatState.state = combatStatus.getCombatState();
            this.dynamic.maxHealth.state = combatStatus.initHealth;
            this.dynamic.maxArmor.state = combatStatus.getMaxArmor();
            this.dynamic.health.state = combatStatus.getHealth();
            this.dynamic.armor.state = combatStatus.getArmor();
        };

        CombatModule.prototype.interpretCombatState = function(param, key, property) {
            return this[param][key][property];
        };

        CombatModule.prototype.applyFeedbackMap = function(module, feedback) {
            var param =         feedback.param;
            var key =           feedback.key;
            var property =      feedback.property;
            var targetStateId = feedback.stateid;
            var factor =        feedback.factor;
            var state =         module.getPieceStateById(targetStateId);
            state.value =       this.interpretCombatState(param, key, property) * factor;
        };

        CombatModule.prototype.applyFeedback = function(module, feedbackMap) {
            for (var i = 0; i < feedbackMap.length; i++) {
                this.applyFeedbackMap(module, feedbackMap[i]);
            }
        };

        CombatModule.prototype.updateCombatState = function(piece, simulationState, module) {
            var combatStatus = piece.getCombatStatus();

            if (!combatStatus) {
                console.log("Combat Status missing?", this);
                return;
            }

            this.applyCombatStatus(combatStatus);
            this.applyFeedback(module, this.feedbackMap);
            return piece;
        };

        CombatModule.prototype.removeCombatModule = function () {
            this.pipeObj.removePipelineObject();
        };


        return CombatModule
    });
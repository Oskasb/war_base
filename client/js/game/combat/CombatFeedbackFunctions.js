"use strict";


define([
    'EffectsAPI',
    'game/modules/ModuleEffectCreator'

], function(
    EffectsAPI,
    ModuleEffectCreator
) {

    var CombatFeedbackFunctions = function() {

    };


    CombatFeedbackFunctions.prototype.registerAttackHit = function(actor, posVec, normalVec, damage, moduleEffectId) {
        ModuleEffectCreator.createTemporaryPassiveEffect(moduleEffectId, posVec, normalVec)


    };


    CombatFeedbackFunctions.prototype.tickEffectPlayers = function(tpf) {

    };


    return CombatFeedbackFunctions;

});
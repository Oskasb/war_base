"use strict";


define([
    'PipelineAPI',
    'EffectsAPI',
    'game/modules/ModuleEffectCreator'

], function(
    PipelineAPI,
    EffectsAPI,
    ModuleEffectCreator
) {

    var calcVec = new THREE.Vector3();
    var calcVec2 = new THREE.Vector3();

    var activeElements = {};

    var GuiFeedbackFunctions = function() {

    };

    var generateElement = function(pos, particleFxId, store) {

        return ModuleEffectCreator.createPassiveEffect(
            particleFxId,
            pos,
            calcVec2,
            null,
            null,
            store
        );

    };

    GuiFeedbackFunctions.prototype.enableElement = function(elementId, posVec, particleFxId) {

        calcVec.copy(posVec);

        if (!activeElements[elementId]) {
            activeElements[elementId] = [];
        }

        return generateElement(calcVec, particleFxId, activeElements[elementId]);
    };


    GuiFeedbackFunctions.prototype.updateElementPosition = function(elementId, posVec) {
        for (var i = 0; i < activeElements[elementId].length; i++) {
            ModuleEffectCreator.setEffectPosition(activeElements[elementId][i], posVec);
        }
    };

    GuiFeedbackFunctions.prototype.disableElement = function(particleFxId) {
        ModuleEffectCreator.removeModuleStaticEffect(activeElements[particleFxId])
    };


    return GuiFeedbackFunctions;

});
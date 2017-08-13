"use strict";


define([
        'ThreeAPI',
        'game/modules/ModuleEffectCreator'
    ],
    function(
        ThreeAPI,
        ModuleEffectCreator
    ) {

        var ModuleCallbacks = function() {

        };

        ModuleCallbacks.transform = function(module, target, state) {
            module.visualModule.rootObj[target.parameter][target.axis] = state.getValue();
        };

        ModuleCallbacks.animate_texture = function(module, target, state) {
            ThreeAPI.animateModelTexture(module.visualModule.model, state.getValue()*target.offsetxy[0]*target.factor, state.getValue()*target.offsetxy[1]*target.factor);//
        };

        ModuleCallbacks.module_emit_effect = function(module, target, state) {
            ModuleEffectCreator.createModuleApplyEmitEffect(module.visualModule.model, target.module_effect, module.config.transform, state.getValue(), target.glue_to_ground)
        };


        return ModuleCallbacks;

    });
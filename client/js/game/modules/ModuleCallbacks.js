"use strict";


define([
        'ThreeAPI',
        'PipelineAPI',
        'game/modules/ModuleEffectCreator'
    ],
    function(
        ThreeAPI,
        PipelineAPI,
        ModuleEffectCreator
    ) {

        var mouseState;
        var line;

        var fetchLine = function(src, data) {
            line = data;
        };

        var fetchPointer = function(src, data) {
            mouseState = data;
        };

        PipelineAPI.subscribeToCategoryKey('POINTER_STATE', 'line', fetchLine);
        PipelineAPI.subscribeToCategoryKey('POINTER_STATE', 'mouseState', fetchPointer);

        var ModuleCallbacks = function() {};

        ModuleCallbacks.read_press_active = function(module, target, state) {
            if (mouseState.action[0] + 0.00001 !== state.getValue() && !mouseState.action[1]) {
                state.setValueAtTime(mouseState.action[0] * target.factor + 0.00001, target.time);
            }
        };

        ModuleCallbacks.read_input_vector = function(module, target, state) {
            if (mouseState.action[0]) {
                state.setValueAtTime(line[target.parameter] * target.factor, target.time);
            }
        };

        ModuleCallbacks.transform = function(module, target, state) {
            module.visualModule.rootObj[target.parameter][target.axis] = state.getValue();
        };

        ModuleCallbacks.scale_uniform = function(module, target, state) {
            module.visualModule.rootObj.scale.setScalar(state.getValue());
        };

        ModuleCallbacks.quat_axis = function(module, target, state) {
            module.visualModule.rootObj.quaternion[target.axis] = state.getValue();
            module.needsNormalize = true;

        };

        ModuleCallbacks.animate_texture = function(module, target, state) {
            ThreeAPI.animateModelTexture(module.visualModule.model, state.getValue()*target.offsetxy[0]*target.factor, state.getValue()*target.offsetxy[1]*target.factor);//
        };

        ModuleCallbacks.module_emit_effect = function(module, target, state) {
            if (Math.random() < state.getValue()) {
                ModuleEffectCreator.createModuleApplyEmitEffect(module.visualModule.model || module.visualModule.rootObj , target.module_effect, module.config.transform, state.getValue(), target.glue_to_ground)
            }
        };

        return ModuleCallbacks;

    });
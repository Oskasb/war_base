"use strict";


define([
        'ThreeAPI',
        'PipelineAPI'
    ],
    function(
        ThreeAPI,
        PipelineAPI
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

        ModuleCallbacks.read_press_active = function(module, target) {
            if (mouseState.action[0] + 0.00001 !== target.stateValue && !mouseState.action[1]) {
                target.state.setValueAtTime(mouseState.action[0] * target.config.factor + 0.00001, target.config.time);
            }
        };

        ModuleCallbacks.read_input_vector = function(module, target) {
            if (mouseState.action[0]) {
                target.state.setValueAtTime(line[target.config.parameter] * target.config.factor, target.config.time);
            }
        };

        ModuleCallbacks.transform = function(module, target) {
            module.visualModule.getParentObject3d()[target.config.parameter][target.config.axis] = target.state.getValue();
        };

        ModuleCallbacks.scale_uniform = function(module, target) {
            module.visualModule.getParentObject3d().scale.setScalar(target.state.getValue());
        };

        ModuleCallbacks.quat_axis = function(module, target) {
            module.visualModule.getParentObject3d().quaternion[target.config.axis] = target.state.getValue();
            module.needsNormalize = true;

        };

        ModuleCallbacks.animate_texture = function(module, target) {
            module.visualModule.addEffectTarget(target);
        };

        ModuleCallbacks.module_emit_effect = function(module, target) {
            module.visualModule.addEffectTarget(target);
        };

        return ModuleCallbacks;

    });
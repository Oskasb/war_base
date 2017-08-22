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



        ModuleCallbacks.apply_target_piece_position = function(module, target) {
            if (mouseState.action[0]) {

            //    module.visualModule.getParentObject3d()[target.config.parameter][target.config.axis] = target.state.getValue();

            }
        };

        ModuleCallbacks.read_press_active = function(module, target) {
            var config = target.config;
            var press = mouseState.action[0];
            var time = press*config.time + (1-press)*config.release_time || config.time*2;
            if (press !== target.stateValue && !mouseState.action[1]) {
                target.state.setValueAtTime(press * target.config.factor, time);
            }
        };

        ModuleCallbacks.read_input_vector = function(module, target) {
            var config = target.config;
            var state = target.state;
            var sample = line[config.parameter]  * config.factor || 1;

            var clamp_min = config.clamp_min || -Infinity;
            var clamp_max = config.clamp_max || Infinity;
            var threshold_lower = config.threshold_lower || Infinity;
            var threshold_upper = config.threshold_upper || Infinity;

            if (mouseState.action[0] && sample > threshold_lower && sample < threshold_upper) {
                var value = MATH.clamp(sample, clamp_min, clamp_max);
                state.setValueAtTime(value, config.time);
            } else {
                state.setValueAtTime(0, config.release_time);
            }
        };


        ModuleCallbacks.transform = function(module, target) {
            module.visualModule.getRootObject3d()[target.config.parameter][target.config.axis] = target.state.getValue();
        };

        ModuleCallbacks.scale_uniform = function(module, target) {
            var scale = target.state.getValue();
            if (scale < 0.0001) scale = 0.0001;
            module.visualModule.getRootObject3d().scale.setScalar(scale);
        };

        ModuleCallbacks.quat_axis = function(module, target) {
            module.visualModule.getRootObject3d().quaternion[target.config.axis] = target.state.getValue();
            module.needsNormalize = true;

        };

        ModuleCallbacks.animate_texture = function(module, target) {
            module.visualModule.addEffectTarget(target);
        };

        ModuleCallbacks.module_emit_effect = function(module, target) {
            module.visualModule.addEffectTarget(target);
        };


        ModuleCallbacks.module_ground_print_effect = function(module, target) {
            module.visualModule.addEffectTarget(target);
        };

        ModuleCallbacks.module_static_state_effect = function(module, target) {
            module.visualModule.addEffectTarget(target);
        };

        ModuleCallbacks.remove_module_static_effect = function(module, target) {
            module.visualModule.addEffectTarget(target);
        };

        return ModuleCallbacks;

    });
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

        ModuleCallbacks.scale_uniform = function(module, target) {
            var config = target.config;
            var value = target.state.getValue();
            var clamp_min = config.clamp_min || 0.001;
            var clamp_max = config.clamp_max || 1;
            if (value < clamp_min && !module.visualModule.hidden) {
                module.visualModule.hide();
                return;
            } else if (module.visualModule.hidden) {
                module.visualModule.show();
            }
            var scale = MATH.clamp(value, clamp_min, clamp_max);
            module.visualModule.getRootObject3d().scale.setScalar(scale);
        };

        ModuleCallbacks.read_press_active = function(module, target) {
            var config = target.config;
            var press = mouseState.action[0];
            var time = press*config.time + (1-press)*config.release_time || config.time*2;
            if (press !== target.stateValue && !mouseState.action[1]) {
                target.state.setValueAtTime(press * target.config.factor, time);
            }
        };


        function checkConditions(source, conditions) {
            if (!conditions) return true;

            for (var i = 0; i < conditions.length; i++) {
                var condition = conditions[i];

                var threshold_lower = condition.threshold_lower || Infinity;
                var threshold_upper = condition.threshold_upper || Infinity;

                var sample = source[condition.parameter];

                if (threshold_lower > threshold_upper) {
                    if (sample < threshold_lower && sample > threshold_upper) {
                        return false;
                    }
                } else if (sample < threshold_lower || sample > threshold_upper) {
                    return false;
                }
            }

            return true;
        };

        ModuleCallbacks.read_input_vector = function(module, target) {

            var press = mouseState.action[0];
            var config = target.config;
            var state = target.state;

            if (!press) {
                state.setValueAtTime(0, config.release_time);
                state.setSampler(null);
                return;
            }

            if (state.getSampler()) {
                if (state.getSampler() !== module) {
                    return;
                }
            }

                var sample = line[config.parameter]  * config.factor || 1;

                if (checkConditions(line, config.conditions)) {
                    var clamp_min = config.clamp_min || -Infinity;
                    var clamp_max = config.clamp_max || Infinity;
                    var value = MATH.clamp(sample, clamp_min, clamp_max);
                    state.setValueAtTime(value, config.time);
                    state.setSampler(module);
                } else {
                    if (state.getSampler() === module) {
                        state.setValueAtTime(0, config.release_time);
                        state.setSampler(null);
                    }
                }

        };


        ModuleCallbacks.transform = function(module, target) {
            module.visualModule.getRootObject3d()[target.config.parameter][target.config.axis] = target.state.getValue();
        };



        ModuleCallbacks.quat_axis = function(module, target) {
            target.state.isRadial(true)
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
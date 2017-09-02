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

        var calcVec = new THREE.Vector3();
        var calcVec2 = new THREE.Vector3();

        var fetchLine = function(src, data) {
            line = data;
        };

        var fetchPointer = function(src, data) {
            mouseState = data;
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

        PipelineAPI.subscribeToCategoryKey('POINTER_STATE', 'line', fetchLine);
        PipelineAPI.subscribeToCategoryKey('POINTER_STATE', 'mouseState', fetchPointer);

        var ModuleCallbacks = function() {};


        ModuleCallbacks.apply_target_piece_position = function(module, target) {
            if (mouseState.action[0]) {

            //    module.visualModule.getParentObject3d()[target.config.parameter][target.config.axis] = target.state.getValue();

            }
        };

        ModuleCallbacks.call_pointer_action_self = function(module, target, enable) {

            var press = mouseState.action[0];
            var state = target.state;
            var config = target.config;

            if (!press) {
                if (state.targetValue !== 0) {
                    state.setValueAtTime(0, config.release_time);
                    enable(false);
                }
                return;
            }

            if (state.targetValue === 1) {
                return;
            }


            var range = config.range;

            calcVec.setFromMatrixPosition(module.visualModule.rootObj.matrixWorld);

            ThreeAPI.toScreenPosition(calcVec, calcVec2);

            var distsq = ThreeAPI.getSpatialFunctions().getHoverDistanceToPos(calcVec2, mouseState);

            if (distsq < range) {
                state.setValueAtTime(1, config.time);
                enable(true);
            }

        };

        ModuleCallbacks.call_enable_target_controls = function(module, target, enable) {


        };

        ModuleCallbacks.apply_transform_state = function(module, target) {

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


        ModuleCallbacks.read_input_vector = function(module, target, enable) {
            var state = target.state;
            var config = target.config;
            if (!enable()) {
                if (state.targetValue !== 0) {
                    state.setValueAtTime(0, config.release_time);
                }
                return;
            }

            var press = mouseState.action[0];

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
            module.visualModule.targetQuaternion[target.config.axis] = target.state.targetValue;
            module.interpolateQuaternion = target.state.progressDelta;
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
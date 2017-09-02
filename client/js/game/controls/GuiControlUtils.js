"use strict";


define([
    'ThreeAPI',
    'PipelineAPI'

], function(
    ThreeAPI,
    PipelineAPI

) {


    var mouseState;
    var line;

    var calcVec = new THREE.Vector3();
    var calcVec2 = new THREE.Vector3();


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
    }


    var GuiControlUtils = function() {

        var fetchLine = function(src, data) {
            line = data;
        };

        var fetchPointer = function(src, data) {
            mouseState = data;
        };

        PipelineAPI.subscribeToCategoryKey('POINTER_STATE', 'line', fetchLine);
        PipelineAPI.subscribeToCategoryKey('POINTER_STATE', 'mouseState', fetchPointer);
    };

    GuiControlUtils.prototype.pointerActionOnSelf = function(module, target, enable) {
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

    GuiControlUtils.prototype.scaleModuleUniform = function(module, target, enable) {
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

    GuiControlUtils.prototype.readPressActive = function(module, target, enable) {
        var config = target.config;
        var press = mouseState.action[0];
        var time = press*config.time + (1-press)*config.release_time || config.time*2;
        if (press !== target.stateValue && !mouseState.action[1]) {
            target.state.setValueAtTime(press * target.config.factor, time);
        }
    };

    GuiControlUtils.prototype.readInputVector = function(module, target, enable) {
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

    GuiControlUtils.prototype.tickEffectPlayers = function(module, target, enable) {

    };


    return GuiControlUtils;

});
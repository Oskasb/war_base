"use strict";


define([
    'ThreeAPI',
    'PipelineAPI',
    'game/controls/GuiControlState'

], function(
    ThreeAPI,
    PipelineAPI,
    GuiControlState
) {

    var GameAPI;
    var mouseState;
    var line;
    var guiControlState;

    var hoverDistance;

    var calcVec = new THREE.Vector3();
    var calcVec2 = new THREE.Vector3();
    var calcEuler = new THREE.Euler();
    var calcEuler2 = new THREE.Euler();
    var calcObj = new THREE.Object3D();


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


    function calcInteractionRange(press, state, config, enable) {
        if (!press) {
            if (state.targetValue !== 0) {
                state.setValueAtTime(0, config.release_time);
                enable(false);
                guiControlState.releaseActionTargetPiece();
            }
            return;
        }

        return config.range;
    }


    function screenSpaceActionInRange(module, range, state, config) {

        if (state.targetValue === 1) {
            return;
        }

        calcVec.setFromMatrixPosition(module.visualModule.rootObj.matrixWorld);

        ThreeAPI.toScreenPosition(calcVec, calcVec2);

        var distsq = ThreeAPI.getSpatialFunctions().getHoverDistanceToPos(calcVec2, mouseState);

        if (distsq < range) {
            state.setValueAtTime(1, config.time);
            return true;
        }
    }


    function getActorNearestPointer() {

        hoverDistance = 999999;
        var actors = GameAPI.getActors();
        var distsq = 0;

        var selectedActor;

        for (var i = 0; i < actors.length; i++) {

            var piece = actors[i].piece;

            if (piece.render) {
                calcVec.setFromMatrixPosition(actors[i].piece.rootObj3D.matrixWorld);
                ThreeAPI.toScreenPosition(calcVec, calcVec2);
                distsq = ThreeAPI.getSpatialFunctions().getHoverDistanceToPos(calcVec2, mouseState);
                if (distsq < hoverDistance) {
                    hoverDistance = distsq;
                    selectedActor = actors[i];
                }
            }
        }

        return selectedActor
    }


    var GuiControlUtils = function(gameApi) {

        GameAPI = gameApi;

        guiControlState = new GuiControlState();

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

        var controledActor = GameAPI.getControlledActor();
        if (!controledActor) return;

        if (!press) {
            enable(false);
            state.setValueAtTime(0, config.release_time);
            guiControlState.setActionTargetPiece(null);
            guiControlState.setActionTargetModule(null);
            guiControlState.setPressStartTarget(null)
            return;
        }

        enable(true);

        if (guiControlState.getActionTargetPiece() === GameAPI.getControlledActor().piece) {
            return;
        }

        var hoverActor = guiControlState.getHoverTargetActor();

        if (!hoverActor) return;

        if (guiControlState.isPressStartTarget(hoverActor)) {
            if (hoverActor === GameAPI.getControlledActor()) {
                state.setValueAtTime(1, config.time);
                guiControlState.setActionTargetPiece(hoverActor.piece);
            }
        }

    };


    GuiControlUtils.prototype.pointerActionOnActors = function(module, target, enable) {
        var press = mouseState.action[0];

        var startTarget = guiControlState.getPressStartTarget();

        if (press) {

            if (guiControlState.getPressSampleFrames() == 0) {
                enable(true);
            }

            guiControlState.addPressSampleFrame();

            if (startTarget) {
                if (startTarget === guiControlState.getActivatedSelectionTarget()) {

                    if (guiControlState.getPressStartTarget() === guiControlState.getSelectedTargetActor()) {
                        guiControlState.setActivatedSelectionTarget(null);
                        guiControlState.releaseSelectedTargetActor();
                    }

                    guiControlState.addPressSampleFrame();
                    guiControlState.setHoverTargetActor(null);
                    guiControlState.setPressStartTarget(null);
                    guiControlState.setActivatedSelectionTarget(null);

                    enable(false);
                }

                if (startTarget === guiControlState.getSelectedTargetActor()) {


                    //    guiControlState.setActivatedSelectionTarget(guiControlState.getPressStartTarget());
                    //    guiControlState.releaseSelectedTargetActor();

                    guiControlState.addPressSampleFrame();
                    guiControlState.setHoverTargetActor(null);
                    //    guiControlState.setPressStartTarget(null);


                    //    enable(false);
                }
            }

        } else {

            guiControlState.clearPressSampleFrames();

            if (!enable()) return;

            if (startTarget === guiControlState.getSelectedTargetActor()) {

                guiControlState.releaseSelectedTargetActor();

                if (guiControlState.getHoverTargetActor() === startTarget) {

                    guiControlState.setActivatedSelectionTarget(startTarget);
                    guiControlState.releaseSelectedTargetActor();

                } else {

                    if (guiControlState.getHoverTargetActor() === guiControlState.getActivatedSelectionTarget()) {
                        guiControlState.setActivatedSelectionTarget(null);
                    }

                }
                guiControlState.setPressStartTarget(null);
                enable(false);
            }

        }


        var state = target.state;
        var config = target.config;

        if (!enable()) {
            state.setValueAtTime(0, config.release_time);
            guiControlState.setHoverTargetActor(null);
        }

        if (guiControlState.getActionTargetPiece()) {
            if (enable()) {
                state.setValueAtTime(0, config.release_time);
                enable(false);
            }
            guiControlState.setHoverTargetActor(null);
            return;
        };

        if (!press && state.targetValue) {

            guiControlState.selectCurrentHoverActor();
            guiControlState.setPressStartTarget(null)
        }

        var range = calcInteractionRange(press, state, config, enable);

        var actor = getActorNearestPointer();

        if (!actor) return;

        if (hoverDistance < range) {
            state.setValueAtTime(1, config.time);
            enable(true);

            if (guiControlState.getPressSampleFrames() < 2) {
                if (!guiControlState.getPressStartTarget()) {
                    guiControlState.setPressStartTarget(actor)
                }
            }

            guiControlState.setHoverTargetActor(actor);
        } else {

            state.setValueAtTime(0, config.release_time);
            enable(false);
            guiControlState.setHoverTargetActor(null);
        }

    };


    function inheritActorStatesInTime(inheritStates, piece, actor, time) {

        var targetState;
        var sourceState;

        for (var i = 0; i < inheritStates.length; i++) {
            targetState = piece.getPieceStateByStateId(inheritStates[i]);
            sourceState = actor.piece.getPieceStateByStateId(inheritStates[i]);
            if (!sourceState) {
                console.log("No source state:", targetState, actor.piece);
                return;
            }
            targetState.setValueAtTime(sourceState.getValue(), time);
        }
    }


    GuiControlUtils.prototype.inheritActivatedActorStates = function(module, target, enable) {
        var state = target.state;

        //    if (!enable()) return;

        var activatedActor = guiControlState.getActivatedSelectionTarget();

        if (!activatedActor) return;

        var config = target.config;
        var time = config.time;
        var pointerPiece = enable();
        var inheritState = config.inherit_states;

        inheritActorStatesInTime(inheritState, pointerPiece, activatedActor, time);
    };

    GuiControlUtils.prototype.inheritSelectedActorStates = function(module, target, enable) {
        var state = target.state;

    //    if (!enable()) return;

        var selectedActor = guiControlState.getSelectedTargetActor();

        if (!selectedActor) return;

        var config = target.config;
        var time = config.time;
        var pointerPiece = enable();
        var inheritState = config.inherit_states;

        inheritActorStatesInTime(inheritState, pointerPiece, selectedActor, time);
    };

    GuiControlUtils.prototype.inheritHoverActorStates = function(module, target, enable) {
        var state = target.state;

        if (!enable()) return;

        var hoverActor = guiControlState.getHoverTargetActor();

        if (!hoverActor) return;

        var config = target.config;
        var time = config.time;
        var pointerPiece = enable();
        var inheritState = config.inherit_states;

        inheritActorStatesInTime(inheritState, pointerPiece, hoverActor, time);
    };

    GuiControlUtils.prototype.focusHoverActor = function(module, target, enable) {
        var state = target.state;

        if (!enable()) return;

        var hoverActor = guiControlState.getHoverTargetActor();

        if (!hoverActor) return;

        if (!hoverActor.piece.render) return;

        var config = target.config;
        var time = config.time;
        var pointerPiece = enable();
        var inheritState = config.inherit_states;

        inheritActorStatesInTime(inheritState, pointerPiece, hoverActor, time);
    };

    GuiControlUtils.prototype.sampleSelectedActor = function(module, target, enable) {
        var state = target.state;
        var config = target.config;
        var time = config.time;
        var factor = config.factor;

        var selectedActor = guiControlState.getSelectedTargetActor();

        if (!selectedActor) {
            state.setValueAtTime(0, config.release_time);
            return;
        }

        if (state.targetValue === 1) return;
        state.setValueAtTime(1, time);

    };

    GuiControlUtils.prototype.sampleActivatedActor = function(module, target, enable) {
        var state = target.state;
        var config = target.config;
        var time = config.time;

        var activatedActor = guiControlState.getActivatedSelectionTarget();

        if (!activatedActor) {
            state.setValueAtTime(0, config.release_time);
            return;
        }

        if (state.targetValue === 1) return;
        state.setValueAtTime(1, time);

    };

    GuiControlUtils.prototype.sampleSelectedActorSize = function(module, target, enable) {
        var state = target.state;
        var config = target.config;
        var time = config.time;
        var factor = config.factor;

        var selectedActor = guiControlState.getSelectedTargetActor();

        if (!selectedActor) return;
        var size = selectedActor.piece.boundingSize;

        if (state.targetValue === size*factor) return;
        state.setValueAtTime(size*factor, time);
    };

    GuiControlUtils.prototype.sampleActiveActorSize = function(module, target, enable) {
        var state = target.state;
        var config = target.config;
        var time = config.time;
        var factor = config.factor;

        var activatedActor = guiControlState.getActivatedSelectionTarget();

        if (!activatedActor) return;
        var size = activatedActor.piece.boundingSize;

        if (state.targetValue === size*factor) return;
        state.setValueAtTime(size*factor, time);
    };


    GuiControlUtils.prototype.scaleModuleUniform = function(module, target, enable) {

        var config = target.config;
        var value = target.state.getValue();
        var clamp_min = config.clamp_min || 0.00001;
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

    GuiControlUtils.prototype.scaleModuleAxis = function(module, target, enable) {

        var config = target.config;
        var value = target.state.getValue() || 0.001;
        var factor = config.factor;
        var axis = config.axis || ['x', 'z'];
        var offset = config.offset || 0;

        for (var i = 0; i < axis.length; i++) {
            module.visualModule.getRootObject3d().scale[axis[i]] = value*factor + offset;
        }

    };

    GuiControlUtils.prototype.animateModuleParameterAxis = function(module, target, enable) {

        var config = target.config;
        var time = ThreeAPI.getTimeElapsed();

        var value = target.state.getValue() || 1;
        var amplitude = config.amplitude || 1;
        var speed = config.speed || 1;
        var parameter = config.parameter || 'scale';
        var axis = config.axis || ['x', 'z'];
        var offset = config.offset || 0;
        var functionKey = config.functionKey || 'sinwave';

        var func = MATH.animationFunctions[functionKey];

        var resut = func(time, speed, amplitude * value) + offset;

        for (var i = 0; i < axis.length; i++) {
            module.visualModule.getRootObject3d()[parameter][axis[i]] = resut;
        }

    };

    GuiControlUtils.prototype.readPressActive = function(module, target, enable) {
        var config = target.config;
        var press = mouseState.action[0];
        var time = press*config.time + (1-press)*config.release_time || config.time*2;
        if (press !== target.stateValue && !mouseState.action[1]) {
            target.state.setValueAtTime(press * target.config.factor, time);
        }
    };


    var testline = {};

    GuiControlUtils.prototype.readInputVector = function(module, target, enable) {
        var state = target.state;
        var config = target.config;

        var compensateRotation = config.compensateRotation || 0;

        var controlledActor = GameAPI.getControlledActor();

        if (!controlledActor) {
            console.log("Cant get line with no controlled actor")
            return;
        }

        testline.zrot = line.zrot;
        testline.w = line.w;

        if (guiControlState.getActionTargetPiece() !== controlledActor.piece) {
            state.setValueAtTime(0, config.release_time);
            state.setSampler(null);
            enable(false);
        }

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


        if (compensateRotation) {

            var controlledPiece = controlledActor.piece;
            calcVec.set(0, 0, 1);
            controlledPiece.rootObj3D.getWorldDirection(calcVec);
            var pieceRot = Math.atan2(calcVec.z, calcVec.x) - Math.PI*0.5;
            testline.zrot = MATH.addAngles(pieceRot, testline.zrot, pieceRot);


            calcVec.set(0, 0, -1);

            ThreeAPI.getCamera().getWorldDirection(calcVec);
            var camRot = -Math.atan2(calcVec.z, calcVec.x) - Math.PI*0.5;
            testline.zrot = MATH.addAngles(testline.zrot, camRot);

        }


        var sample = testline[config.parameter]  * config.factor || 1;

        if (checkConditions(testline, config.conditions)) {
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
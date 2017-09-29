"use strict";


define([
        'game/controls/GuiControlUtils'
    ],
    function(
        GuiControlUtils
    ) {

        var guiControlUtils;

        var weaponControlUtils;

        var GameAPI;

        var ModuleCallbacks = function() {};

        ModuleCallbacks.initCallbacks = function(gameApi) {
            GameAPI = gameApi;
            guiControlUtils = new GuiControlUtils(GameAPI);
        };

        ModuleCallbacks.apply_target_piece_position = function(module, target) {
            if (mouseState.action[0]) {

            //    module.visualModule.getParentObject3d()[target.config.parameter][target.config.axis] = target.state.getValue();

            }
        };

        ModuleCallbacks.call_pointer_action_self = function(module, target, enable) {
            target.state.dirty = true;
            guiControlUtils.pointerActionOnSelf(module, target, enable);
        };

        ModuleCallbacks.call_pointer_hover_actors = function(module, target, enable) {
            target.state.dirty = true;
            guiControlUtils.pointerActionOnActors(module, target, enable);
        };

        ModuleCallbacks.call_inherit_hover_actor_states = function(module, target, enable) {
            target.state.dirty = true;
            guiControlUtils.inheritHoverActorStates(module, target, enable);
        };

        ModuleCallbacks.call_inherit_selected_actor_states = function(module, target, enable) {
            target.state.dirty = true;
            guiControlUtils.inheritSelectedActorStates(module, target, enable);
        };

        ModuleCallbacks.call_inherit_activated_actor_states = function(module, target, enable) {
            target.state.dirty = true;
            guiControlUtils.inheritActivatedActorStates(module, target, enable);
        };

        ModuleCallbacks.call_focus_hover_actor = function(module, target, enable) {
            target.state.dirty = true;
            guiControlUtils.focusHoverActor(module, target, enable);
        };

        ModuleCallbacks.call_sample_selected_actor = function(module, target, enable) {
            target.state.dirty = true;
            var selectedActor = guiControlUtils.sampleSelectedActor(module, target, enable);
            GameAPI.setSelectedActor(selectedActor);
        };

        ModuleCallbacks.call_sample_activated_actor = function(module, target, enable) {
            target.state.dirty = true;
            var activatedActor = guiControlUtils.sampleActivatedActor(module, target, enable);
            GameAPI.selectionActivatedActor(activatedActor);
        };

        ModuleCallbacks.call_sample_selected_actor_size = function(module, target, enable) {
            target.state.dirty = true;
            guiControlUtils.sampleSelectedActorSize(module, target, enable);
        };

        ModuleCallbacks.call_sample_activated_actor_size = function(module, target, enable) {
            target.state.dirty = true;
            guiControlUtils.sampleActiveActorSize(module, target, enable);
        };


        ModuleCallbacks.call_selection_activated = function(module, target, enable) {
            target.state.dirty = true;
            var piece = enable();
            if (target.state.getValue() === 1) {
                if (piece) {
                    if (GameAPI.getActiveCameraControl().getActivatedSelection() !== piece) {
                        GameAPI.getActiveCameraControl().setActivatedSelection(piece)
                    }
                }
            } else {
                if (GameAPI.getActiveCameraControl()) {
                    if (GameAPI.getActiveCameraControl().getActivatedSelection()) {
                        GameAPI.getActiveCameraControl().setActivatedSelection(null)
                        GameAPI.selectionActivatedActor(null);
                    }
                }
            }
        };


        ModuleCallbacks.call_notify_actor_active = function(module, target, enable) {
            var value = Math.round(target.state.buffer[0]);
            var piece = enable();
                if (!piece) {
                    enable(true);
                    piece = enable();
                }

                piece.setPieceActivationState(value);

                if (piece.getPieceActivationState() !== value) {

                    if (value > ENUMS.PieceActivationStates.HIDDEN) {
                        piece.setRendereable(true);

                    }
                    piece.setStatesDirty();
                }

        };

        ModuleCallbacks.call_enable_target_controls = function(module, target, enable) {


        };

        ModuleCallbacks.apply_transform_state = function(module, target) {

        };

        ModuleCallbacks.scale_uniform = function(module, target, enable) {
            target.state.dirty = true;
            guiControlUtils.scaleModuleUniform(module, target, enable);
        };

        ModuleCallbacks.scale_axis = function(module, target, enable) {
            target.state.dirty = true;
            guiControlUtils.scaleModuleAxis(module, target, enable);

        };

        ModuleCallbacks.animate_transform = function(module, target, enable) {
            target.state.dirty = true;
            guiControlUtils.animateModuleParameterAxis(module, target, enable);
        };

        ModuleCallbacks.read_press_active = function(module, target, enable) {
            target.state.dirty = true;
            guiControlUtils.readPressActive(module, target, enable);
        };


        ModuleCallbacks.read_input_vector = function(module, target, enable) {
            target.state.dirty = true;
            guiControlUtils.readInputVector(module, target, enable);
        };


        ModuleCallbacks.call_weapon_trigger_active = function(module, target, enable) {

        };

        var applyWeaponState = function(weapon, state) {
            weapon.setupDynamicState(state.id, state.buffer[0]);
        };

        ModuleCallbacks.call_weapon_bullet_setup = function(module, target, enable) {
            var weapons = module.weapons;
            var state = target.state;
            for (var i = 0; i < weapons.length; i++) {
                applyWeaponState(weapons[i], state)
            }
        };

        ModuleCallbacks.call_combat_status_update = function(module, target, enable) {
            enable(true);
            var piece = enable();

            var key = target.config.combat_state_setter;

            var combatStatus = piece.getCombatStatus();
            if (!combatStatus) {
                console.log("Piece missing CombatStatus", piece, target);
                return;
            }
            combatStatus.setDynamic(key, target.state.sampleBufferValue())
        };


        ModuleCallbacks.call_weapon_bullet_activate = function(module, target, enable) {

        };

        ModuleCallbacks.call_aim_accuracy_pitch = function(module, target, enable) {

        };

        ModuleCallbacks.call_aim_accuracy_yaw = function(module, target, enable) {

        };

        ModuleCallbacks.transform = function(module, target) {
            if (target.state.isDirty()) {

                var parameter = target.config.parameter;
                var axis = target.config.axis;
                var value = target.state.getValue();
                var currentValue = module.visualModule.getRootObject3d()[parameter][axis];
                var factor = target.config.factor || 1;
                var cumulative = target.config.cumulative || 0;
                module.visualModule.getRootObject3d()[parameter][axis] = value*factor + currentValue*cumulative;
           }

        };

        ModuleCallbacks.quat_axis = function(module, target) {
            if (target.state.isDirty()) {
                module.visualModule.targetQuaternion[target.config.axis] = target.state.targetValue;
                module.interpolateQuaternion = target.state.progressDelta;
            }
        };



        ModuleCallbacks.animate_texture = function(module, target) {
            module.visualModule.addEffectTarget(target);
        };

        ModuleCallbacks.module_emit_effect = function(module, target) {
            module.visualModule.addEffectTarget(target);
        };



        ModuleCallbacks.module_weapon_emit_bullet_effect = function(module, target) {
            module.visualModule.addEffectTarget(target);
        };

        ModuleCallbacks.module_ground_print_effect = function(module, target) {
            module.visualModule.addEffectTarget(target);
        };

        ModuleCallbacks.module_static_velocity_effect = function(module, target) {
            module.visualModule.addEffectTarget(target);
        };

        ModuleCallbacks.module_static_state_effect = function(module, target) {
            module.visualModule.addEffectTarget(target);
        };
        ModuleCallbacks.module_geometry_static_effect = function(module, target) {
            module.visualModule.addEffectTarget(target);
        };
        ModuleCallbacks.remove_module_static_effect = function(module, target) {
            module.visualModule.addEffectTarget(target);
        };




        return ModuleCallbacks;

    });
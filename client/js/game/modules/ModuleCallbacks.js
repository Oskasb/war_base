"use strict";


define([
        'game/controls/GuiControlUtils'
    ],
    function(
        GuiControlUtils
    ) {

        var guiControlUtils;

        var ModuleCallbacks = function() {};

        ModuleCallbacks.initCallbacks = function(GameAPI) {
            guiControlUtils = new GuiControlUtils(GameAPI);
        };

        ModuleCallbacks.apply_target_piece_position = function(module, target) {
            if (mouseState.action[0]) {

            //    module.visualModule.getParentObject3d()[target.config.parameter][target.config.axis] = target.state.getValue();

            }
        };

        ModuleCallbacks.call_pointer_action_self = function(module, target, enable) {
            guiControlUtils.pointerActionOnSelf(module, target, enable);
        };

        ModuleCallbacks.call_pointer_hover_actors = function(module, target, enable) {
            guiControlUtils.pointerActionOnActors(module, target, enable);
        };

        ModuleCallbacks.call_inherit_hover_actor_states = function(module, target, enable) {
            guiControlUtils.inheritHoverActorStates(module, target, enable);
        };

        ModuleCallbacks.call_inherit_selected_actor_states = function(module, target, enable) {
            guiControlUtils.inheritSelectedActorStates(module, target, enable);
        };

        ModuleCallbacks.call_inherit_activated_actor_states = function(module, target, enable) {
            guiControlUtils.inheritActivatedActorStates(module, target, enable);
        };

        ModuleCallbacks.call_focus_hover_actor = function(module, target, enable) {
            guiControlUtils.focusHoverActor(module, target, enable);
        };

        ModuleCallbacks.call_sample_selected_actor = function(module, target, enable) {
            guiControlUtils.sampleSelectedActor(module, target, enable);
        };

        ModuleCallbacks.call_sample_activated_actor = function(module, target, enable) {
            guiControlUtils.sampleActivatedActor(module, target, enable);
        };

        ModuleCallbacks.call_sample_selected_actor_size = function(module, target, enable) {
            guiControlUtils.sampleSelectedActorSize(module, target, enable);
        };

        ModuleCallbacks.call_sample_activated_actor_size = function(module, target, enable) {
            guiControlUtils.sampleActiveActorSize(module, target, enable);
        };

        ModuleCallbacks.call_enable_target_controls = function(module, target, enable) {

        };

        ModuleCallbacks.call_enable_target_controls = function(module, target, enable) {


        };

        ModuleCallbacks.apply_transform_state = function(module, target) {

        };

        ModuleCallbacks.scale_uniform = function(module, target, enable) {
            guiControlUtils.scaleModuleUniform(module, target, enable);
        };

        ModuleCallbacks.scale_axis = function(module, target, enable) {
            guiControlUtils.scaleModuleAxis(module, target, enable);

        };

        ModuleCallbacks.read_press_active = function(module, target, enable) {
            guiControlUtils.readPressActive(module, target, enable);
        };


        ModuleCallbacks.read_input_vector = function(module, target, enable) {
            guiControlUtils.readInputVector(module, target, enable);
        };

        ModuleCallbacks.transform = function(module, target) {
            var parameter = target.config.parameter;
            var axis = target.config.axis;
            var value = target.state.getValue();
            var currentValue = module.visualModule.getRootObject3d()[parameter][axis];
            var factor = target.config.factor || 1;
            var cumulative = target.config.cumulative || 0;
            module.visualModule.getRootObject3d()[parameter][axis] = value*factor + currentValue*cumulative;
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
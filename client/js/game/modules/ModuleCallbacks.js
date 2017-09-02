"use strict";


define([
        'ThreeAPI',
        'PipelineAPI',
    'game/controls/GuiControlState',
        'game/controls/GuiControlUtils'

    ],
    function(
        ThreeAPI,
        PipelineAPI,
        GuiControlState,
        GuiControlUtils
    ) {

        var guiControlState = new GuiControlState();
        var guiControlUtils= new GuiControlUtils();

        var ModuleCallbacks = function() {};

        ModuleCallbacks.apply_target_piece_position = function(module, target) {
            if (mouseState.action[0]) {

            //    module.visualModule.getParentObject3d()[target.config.parameter][target.config.axis] = target.state.getValue();

            }
        };

        ModuleCallbacks.call_pointer_action_self = function(module, target, enable) {
            guiControlUtils.pointerActionOnSelf(module, target, enable);
        };

        ModuleCallbacks.call_enable_target_controls = function(module, target, enable) {


        };

        ModuleCallbacks.apply_transform_state = function(module, target) {

        };

        ModuleCallbacks.scale_uniform = function(module, target, enable) {
            guiControlUtils.scaleModuleUniform(module, target, enable);

        };

        ModuleCallbacks.read_press_active = function(module, target, enable) {
            guiControlUtils.readPressActive(module, target, enable);
        };


        ModuleCallbacks.read_input_vector = function(module, target, enable) {
            guiControlUtils.readInputVector(module, target, enable);
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
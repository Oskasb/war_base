"use strict";


define(['PipelineAPI'], function(
    PipelineAPI
) {

    var state = {
        actionTargetActor : null,
        hoverTargetActor : null,
        hoverTargetPiece : null,
        actionTargetPiece : null,
        hoverTargetModule : null,
        actionTargetModule : null,
        commandSourceModule : null,
        pressStartTarget : null,
        activatedSelectionTarget: null,
        pressSampleFrames : 0
    };

    var GuiControlState = function() {
        PipelineAPI.setCategoryKeyValue('CONTROL_DATA', 'CONTROL_STATE', state);
    };


    GuiControlState.prototype.addPressSampleFrame = function() {
        state.pressSampleFrames++;
    };

    GuiControlState.prototype.getPressSampleFrames = function() {
        return state.pressSampleFrames;
    };

    GuiControlState.prototype.clearPressSampleFrames = function() {
        state.pressSampleFrames = 0;
    };


    GuiControlState.prototype.setActivatedSelectionTarget = function(target) {
        state.activatedSelectionTarget = target;
    };


    GuiControlState.prototype.getActivatedSelectionTarget = function() {
        return state.activatedSelectionTarget;
    };


    GuiControlState.prototype.setPressStartTarget = function(target) {
        state.pressStartTarget = target;
    };

    GuiControlState.prototype.getPressStartTarget = function() {
        return state.pressStartTarget;
    };

    GuiControlState.prototype.isPressStartTarget = function(target) {
        return (target === state.pressStartTarget);
    };


    GuiControlState.prototype.setHoverTargetActor = function(actor) {
        state.hoverTargetActor = actor;
    };

    GuiControlState.prototype.getHoverTargetActor = function() {
        return state.hoverTargetActor;
    };


    GuiControlState.prototype.setSelectedTargetActor = function(actor) {
        state.actionTargetActor = actor;
    };

    GuiControlState.prototype.getSelectedTargetActor = function() {
        return state.actionTargetActor;
    };


    GuiControlState.prototype.setHoverTargetPiece = function(piece) {
        state.hoverTargetPiece = piece;
    };

    GuiControlState.prototype.getHoverTargetPiece = function() {
        return state.hoverTargetPiece;
    };


    GuiControlState.prototype.setActionTargetPiece = function(piece) {
        state.actionTargetPiece = piece;
    };


    GuiControlState.prototype.getActionTargetPiece = function() {
        return state.actionTargetPiece;
    };


    GuiControlState.prototype.setHoverTargetModule = function(module) {
        state.hoverTargetModule = module;
    };

    GuiControlState.prototype.getHoverTargetModule = function() {
        return state.hoverTargetModule;
    };

    GuiControlState.prototype.setActionTargetModule = function(module) {
        state.actionTargetModule = module;
    };

    GuiControlState.prototype.getActionTargetModule = function() {
        return state.actionTargetModule;
    };

    GuiControlState.prototype.setCommandSourceModule = function(module) {
        state.commandSourceModule = module;
    };

    GuiControlState.prototype.getCommandActionModule = function() {
        return state.commandSourceModule;
    };

    GuiControlState.prototype.releaseActionTargetPiece = function() {
        this.setActionTargetPiece(null)
    };

    GuiControlState.prototype.releaseSelectedTargetActor = function() {
        this.setSelectedTargetActor(null)
    };

    GuiControlState.prototype.selectCurrentHoverActor = function() {
        this.setSelectedTargetActor(this.getHoverTargetActor());
        this.setHoverTargetActor(null);
    };

    return GuiControlState;

});
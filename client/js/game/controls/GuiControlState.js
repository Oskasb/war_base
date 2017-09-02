"use strict";


define([], function() {



    var GuiControlState = function() {
        this.actionTargetActor = null;
        this.hoverTargetActor = null;

        this.hoverTargetPiece = null;
        this.actionTargetPiece = null;

        this.hoverTargetModule = null;
        this.actionTargetModule = null;

        this.commandSourceModule = null;

        this.pressStartTarget = null;

        this.activatedSelectionTarget = null;

        this.pressSampleFrames = 0;
    };

    GuiControlState.prototype.addPressSampleFrame = function() {
        this.pressSampleFrames++;
    };

    GuiControlState.prototype.getPressSampleFrames = function() {
        return this.pressSampleFrames;
    };

    GuiControlState.prototype.clearPressSampleFrames = function() {
        this.pressSampleFrames = 0;
    };



    GuiControlState.prototype.setActivatedSelectionTarget = function(target) {
        this.activatedSelectionTarget = target;
    };


    GuiControlState.prototype.getActivatedSelectionTarget = function() {
        return this.activatedSelectionTarget;
    };



    GuiControlState.prototype.setPressStartTarget = function(target) {
        this.pressStartTarget = target;
    };

    GuiControlState.prototype.getPressStartTarget = function() {
        return this.pressStartTarget;
    };

    GuiControlState.prototype.isPressStartTarget = function(target) {
        return (target === this.pressStartTarget);
    };


    GuiControlState.prototype.setHoverTargetActor = function(actor) {
        this.hoverTargetActor = actor;
    };

    GuiControlState.prototype.getHoverTargetActor = function() {
        return this.hoverTargetActor;
    };


    GuiControlState.prototype.setSelectedTargetActor = function(actor) {
        this.actionTargetActor = actor;
    };

    GuiControlState.prototype.getSelectedTargetActor = function() {
        return this.actionTargetActor;
    };




    GuiControlState.prototype.setHoverTargetPiece = function(piece) {
        this.hoverTargetPiece = piece;
    };

    GuiControlState.prototype.getHoverTargetPiece = function() {
        return this.hoverTargetPiece;
    };


    GuiControlState.prototype.setActionTargetPiece = function(piece) {
        this.actionTargetPiece = piece;
    };


    GuiControlState.prototype.getActionTargetPiece = function() {
        return this.actionTargetPiece;
    };



    GuiControlState.prototype.setHoverTargetModule = function(module) {
        this.hoverTargetModule = module;
    };

    GuiControlState.prototype.getHoverTargetModule = function() {
        return this.hoverTargetModule;
    };

    GuiControlState.prototype.setActionTargetModule = function(module) {
        this.actionTargetModule = module;
    };

    GuiControlState.prototype.getActionTargetModule = function() {
        return this.actionTargetModule;
    };

    GuiControlState.prototype.setCommandSourceModule = function(module) {
        this.commandSourceModule = module;
    };

    GuiControlState.prototype.getCommandActionModule = function() {
        return this.commandSourceModule;
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
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



    GuiControlState.prototype.selectCurrentHoverActor = function() {
        this.setSelectedTargetActor(this.getHoverTargetActor());
        this.setHoverTargetActor(null);
    };



    return GuiControlState;

});
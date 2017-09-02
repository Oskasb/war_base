"use strict";


define([], function() {


    var GuiControlState = function() {

    };

    GuiControlState.prototype.setup3dScene = function(clientTickCallback, ready) {
        ThreeController.setupThreeRenderer(clientTickCallback, ready);
    };

    GuiControlState.prototype.setupEffectPlayers = function(onReady) {
        EffectsAPI.initEffects(onReady);
        EffectListeners.setupListeners();
        EffectListeners.setEffectCallbacks(ModuleEffectCreator)
    };

    GuiControlState.prototype.tickEffectPlayers = function(tpf) {
        EffectListeners.tickEffects(tpf)
    };


    return GuiControlState;

});
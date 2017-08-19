"use strict";


define([
    '3d/ThreeController',
    'EffectsAPI',
    '3d/effects/EffectListeners',
    'game/modules/ModuleEffectCreator'

], function(
    ThreeController,
    EffectsAPI,
    EffectListeners,
    ModuleEffectCreator
) {
    
    var SceneController = function() {

    };
    

    SceneController.prototype.setup3dScene = function(clientTickCallback, ready) {
        ThreeController.setupThreeRenderer(clientTickCallback, ready);
    };

    SceneController.prototype.setupEffectPlayers = function(onReady) {
        EffectsAPI.initEffects(onReady);
        EffectListeners.setupListeners();
        EffectListeners.setEffectCallbacks(ModuleEffectCreator)
    };
    
    return SceneController;

});
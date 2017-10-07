"use strict";



define([
    'Events',
    '3d/SceneController',
    'application/DataLoader',
    'application/SystemDetector',
    'application/ButtonEventDispatcher',
    'application/ControlStateDispatcher',
    'ui/GameScreen',
    'io/PointerCursor'
], function(
    evt,
    SceneController,
    DataLoader,
    SystemDetector,
    ButtonEventDispatcher,
    ControlStateDispatcher,
    GameScreen,
    PointerCursor
) {

    var dataLoader;

    var Setup = function() {

    };

    Setup.init = function(ModelViewer, onReady) {
        var sceneController = new SceneController();
        dataLoader = new DataLoader();
        dataLoader.loadData(ModelViewer, PointerCursor, sceneController, onReady);
    };

    Setup.completed = function() {
        dataLoader.notifyCompleted()
    };

    return Setup;

});

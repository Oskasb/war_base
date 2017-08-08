"use strict";



require([
    'Events',
    '3d/SceneController',
    'application/DataLoader',
    'application/DevConfigurator',
    'application/FullScreenConfigurator',
    'application/SystemDetector',
    'application/ButtonEventDispatcher',
    'application/ControlStateDispatcher',
    'modelviewer/ModelViewer',
    'modelviewer/EnvironmentLoader',
    'modelviewer/ModelLoader',
    'ui/GameScreen',
    'io/PointerCursor'
], function(
    evt,
    SceneController,
    DataLoader,
    DevConfigurator,
    FullScreenConfigurator,
    SystemDetector,
    ButtonEventDispatcher,
    ControlStateDispatcher,
    ModelViewer,
    EnvironmentLoader,
    ModelLoader,
    GameScreen,
    PointerCursor
) {


    var init = function() {
        new SystemDetector();
        new ButtonEventDispatcher();

        new ControlStateDispatcher();

        GameScreen.registerAppContainer(document.getElementById('canvas_window'));

        var sceneController = new SceneController();
        var dataLoader = new DataLoader();

        dataLoader.loadData(ModelViewer, PointerCursor, sceneController);


        var playerReady = function() {
            new DevConfigurator();
            new FullScreenConfigurator();
            new EnvironmentLoader();
            new ModelLoader();
        };

        evt.on(evt.list().PLAYER_READY, playerReady);
    };

    setTimeout(function() {
        init();
    }, 0)

});

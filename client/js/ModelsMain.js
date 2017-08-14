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
    'modelviewer/PieceLoader',
    'modelviewer/ModelLoader',
    'modelviewer/ModuleLoader',
    'modelviewer/TerrainLoader',
    'modelviewer/ParticleLoader',
    'modelviewer/ViewerPointer',
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
    PieceLoader,
    ModelLoader,
    ModuleLoader,
    TerrainLoader,
    ParticleLoader,
    ViewerPointer,
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
            new ModuleLoader();
            new ViewerPointer();
            new ParticleLoader();
            new PieceLoader();
            new TerrainLoader();
        };

        evt.on(evt.list().PLAYER_READY, playerReady);
    };

    setTimeout(function() {
        init();
    }, 0)

});

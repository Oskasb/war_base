"use strict";


define([
        'Events',
        'PipelineAPI',
        'PipelineObject',
        'ThreeAPI',
        'GameAPI',
        'ui/dom/DomSelectList',
        'ui/dom/DomPanel',
        'ui/GameScreen',
        'game/GameActor',
        'game/pieces/GamePiece',
        'game/pieces/PieceState',
        'modelviewer/ModuleStateViewer'
    ],
    function(
        evt,
        PipelineAPI,
        PipelineObject,
        ThreeAPI,
        GameAPI,
        DomSelectList,
        DomPanel,
        GameScreen,
        GameActor,
        GamePiece,
        PieceState,
        ModuleStateViewer
    ) {

        var panels = {};
        var panelStates = {};
        var loadedModules = {};
        var rootModels = {};
        var stateData;

        function addButton() {
            var buttonEvent = {category:ENUMS.Category.STATUS, key:ENUMS.Key.APP_LOADER, type:ENUMS.Type.toggle};

            var buttonConf = {
                panel:ENUMS.Gui.leftPanel,
                id:"apploaderbutton",
                container:"editor_button_container",
                data:{
                    style:["panel_button", "coloring_button_main_panel"],
                    button:{
                        id:"panel_button",
                        event:buttonEvent
                    },
                    text:'PLAY'
                }
            };

        //    PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {APP_LOADER:true});

            evt.fire(evt.list().ADD_GUI_ELEMENT, {data:buttonConf});

            setTimeout(function() {
                PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {APP_LOADER:false});
            }, 1000);

        }


        var AppLoader = function() {
            this.running = false;
            this.panel = null;
            this.currentValue = 0;

            var _this=this;

            var apply = function(src, value) {
                setTimeout(function() {
                    _this.toggleApp(src, value)
                }, 100);
            };

            PipelineAPI.subscribeToCategoryKey(ENUMS.Category.STATUS, ENUMS.Key.APP_LOADER, apply);

            addButton();

            var time = 0;

            var envs = ['morning', 'evening', 'sunny_day', 'high_noon'];

            var switchTime = 25;
            var transitTime = 20;

            var envIdx = 0;

            var tick = function(e) {

                time += evt.args(e).tpf;

                if (time > switchTime) {
                    setEnvironment(envs[envIdx], 0, transitTime);
                    envIdx++
                    if (envIdx == envs.length) envIdx = 0;
                    time = 0;
                };

                GameAPI.tickGame(evt.args(e).tpf, evt.args(e).time);
            };

            evt.on(evt.list().CLIENT_TICK, tick);

            setEnvironment('fadeout', 0, 0.3);
            ThreeAPI.getEnvironment().enableEnvironment();
        };


        var setEnvironment = function(env, wait, transitionTime) {
            setTimeout(function() {
                ThreeAPI.getEnvironment().setEnvConfigId(env, transitionTime);
            }, wait);
        };

        AppLoader.prototype.loadLevel = function(id, value) {


            var playerAdded = function(actor) {
                playerActor = actor;
                GameAPI.addActor(actor);
                GameAPI.controlActor(actor);
                ThreeAPI.addToScene(actor.piece.rootObj3D);
                ThreeAPI.addToScene(actor.controls.rootObj3D);
            };


            if (value === true) {
                console.log("Load Level: ", id, value);


                var levelready = function(level) {

                    activeLevel = level;

                    setEnvironment('evening', 1000, 3);


                    GameAPI.createActor({dataKey:"actor_sherman_tank"}, playerAdded);

                };

                GameAPI.createLevel({dataKey:id}, levelready);

            }

        };


        var playerActor;
        var activeLevel;


        AppLoader.prototype.toggleApp = function(src, value) {

            var _this = this;

            var playerRemoved = function() {
                playerActor = null;
            };

            if (value) {

                var list = PipelineAPI.readCachedConfigKey('LEVEL_DATA', 'LEVELS');

                var dataList = {};

                for (var i = 0; i < list.length; i++) {
                    dataList[list[i].id] = list[i];
                    if (Math.random() < (i+1) / list.length) {
                        _this.loadLevel(list[i].id, true)
                    }
                }


            } else  {

                setEnvironment('fadeout', 0, 0.3);

                if (playerActor) GameAPI.removeActor(playerActor, playerRemoved);

                if (activeLevel) GameAPI.closeLevel(activeLevel);

                evt.fire(evt.list().QUIT_ACTIVE_LEVEL, {});

            }

        };

        return AppLoader;
    });
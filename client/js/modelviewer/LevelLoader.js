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
            var buttonEvent = {category:ENUMS.Category.STATUS, key:ENUMS.Key.LEVEL_LOADER, type:ENUMS.Type.toggle};

            var buttonConf = {
                panel:ENUMS.Gui.leftPanel,
                id:"levelloaderbutton",
                container:"editor_button_container",
                data:{
                    style:["panel_button", "coloring_button_main_panel"],
                    button:{
                        id:"panel_button",
                        event:buttonEvent
                    },
                    text:'LEVELS'
                }
            };

            PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {LEVEL_LOADER:true});

            evt.fire(evt.list().ADD_GUI_ELEMENT, {data:buttonConf});

            setTimeout(function() {
                PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {LEVEL_LOADER:false});
            }, 1000);

        }


        var LevelLoader = function() {
            this.running = false;
            this.panel = null;
            this.currentValue = 0;

            var _this=this;

            var apply = function(src, value) {
                setTimeout(function() {
                    _this.togglePanel(src, value)
                }, 100);
            };

            PipelineAPI.subscribeToCategoryKey(ENUMS.Category.STATUS, ENUMS.Key.LEVEL_LOADER, apply);

            addButton();

        };


        LevelLoader.prototype.monitorPieceModules = function(piece, bool) {
            ModuleStateViewer.viewPieceStates(piece, bool);
        };


        LevelLoader.prototype.loadLevel = function(id, value) {

            if (!loadedModules[id]) {
                loadedModules[id] = [];

                rootModels[id] = []
            }

            var _this = this;

            if (value === true) {
                console.log("Load Level: ", id, value);

                if (rootModels[id].length) return;


                var levelready = function(level) {

                    if (rootModels[id]) {

                        while (rootModels[id].length) {
                            var p = rootModels[id].pop();
                            GameAPI.closeLevel(p);
                        }

                    }

                    rootModels[id].push(level);
                };

                GameAPI.createLevel({dataKey:id}, levelready);

            } else {

                if (rootModels[id]) {

                    while (rootModels[id].length) {
                        var p = rootModels[id].pop();
                        GameAPI.closeLevel(p);
                    }
                }
            }
        };


        LevelLoader.prototype.togglePanel = function(src, value) {

            if (panelStates[src] === value) {
                return
            }
            panelStates[src] = value;
            var _this = this;

            var category = ENUMS.Category.LOAD_LEVEL;

            var buttonFunc = function(src, value) {
                setTimeout(function() {
                    _this.loadLevel(src, value)
                }, 10);
            };

            var first;

            if (!stateData) {
                stateData = {};
                first = true;
            }

            if (value) {
        //        console.log("Configs: ", PipelineAPI.getCachedConfigs());

                var list = PipelineAPI.readCachedConfigKey('LEVEL_DATA', 'LEVELS');

                var dataList = {};

                for (var i = 0; i < list.length; i++) {
                    dataList[list[i].id] = list[i];
                }

                panels[src] = new DomSelectList(category, dataList, stateData, buttonFunc);



            } else if (panels[src]) {

                panels[src].removeSelectList();
                delete panels[src];

            }

            setTimeout(function() {
                ModuleStateViewer.toggleStateViewer(value);
            },200);


            if (first) {
                PipelineAPI.setCategoryData(category, stateData);
            }
        };

        return LevelLoader;
    });
"use strict";


define([
        'Events',
        'PipelineAPI',
        'PipelineObject',
        'ThreeAPI',
        'ui/dom/DomSelectList',
        'ui/dom/DomPanel',
        'ui/GameScreen',
        'game/GamePiece',
        'game/PieceState',
        'modelviewer/ModuleStateViewer'
    ],
    function(
        evt,
        PipelineAPI,
        PipelineObject,
        ThreeAPI,
        DomSelectList,
        DomPanel,
        GameScreen,
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
            var buttonEvent = {category:ENUMS.Category.STATUS, key:ENUMS.Key.CONTROL_LOADER, type:ENUMS.Type.toggle};

            var buttonConf = {
                panel:ENUMS.Gui.leftPanel,
                id:"controlloaderbutton",
                container:"editor_button_container",
                data:{
                    style:["panel_button", "coloring_button_main_panel"],
                    button:{
                        id:"panel_button",
                        event:buttonEvent
                    },
                    text:'CONTROLS'
                }
            };

            PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {CONTROL_LOADER:true});

            evt.fire(evt.list().ADD_GUI_ELEMENT, {data:buttonConf});

            setTimeout(function() {
                PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {CONTROL_LOADER:false});
            }, 1000);

        }


        var ControlLoader = function() {
            this.running = false;
            this.panel = null;
            this.currentValue = 0;

            var _this=this;

            var apply = function(src, value) {
                setTimeout(function() {
                    _this.togglePanel(src, value)
                }, 100);
            };

            PipelineAPI.subscribeToCategoryKey(ENUMS.Category.STATUS, ENUMS.Key.CONTROL_LOADER, apply);

            addButton();

            var t = 0;

            var tick = function(e) {

                t += evt.args(e).tpf;

                for (var key in rootModels) {


                    if (rootModels[key].length) {

                        var piece = rootModels[key][0];

                        for (var i = 0; i < piece.pieceSlots.length;i++) {

                            var mod = piece.pieceSlots[i].module;

                            var dataCat = "MODULE_DEBUG_"+mod.id;

                            for (var j = 0; j < mod.moduleChannels.length; j++) {
                                PipelineAPI.setCategoryKeyValue(dataCat, mod.moduleChannels[j].state.id, mod.moduleChannels[j].state.getValueRunded(100));
                            }

                        }
                        piece.updateGamePiece(evt.args(e).tpf, new Date().getTime()*0.001);

                    }
                }
            };

            evt.on(evt.list().CLIENT_TICK, tick);
        };


        ControlLoader.prototype.monitorPieceModules = function(piece, bool) {
            ModuleStateViewer.viewPieceStates(piece, bool);
        };


        ControlLoader.prototype.loadPiece = function(id, value) {

            if (!loadedModules[id]) {
                loadedModules[id] = [];

                rootModels[id] = []
            }

            var _this = this;

            if (value === true) {
                console.log("Load Model: ", id, value);

                if (rootModels[id].length) return;


                var ready = function(piece) {

                    if (rootModels[id]) {

                        while (rootModels[id].length) {
                            var p = rootModels[id].pop();
                            _this.monitorPieceModules(p, false);
                            p.removeGamePiece();
                        }

                    }

                    ThreeAPI.addToScene(piece.rootObj3D);
                    //    mod.monitorGameModule(true);
                    rootModels[id].push(piece);
                    _this.monitorPieceModules(piece, true);

                };

                new GamePiece(id, ready);

            } else {

                if (rootModels[id]) {

                    while (rootModels[id].length) {
                        var p = rootModels[id].pop();
                        _this.monitorPieceModules(p, false);
                        p.removeGamePiece();
                    }
                }
            }
        };


        ControlLoader.prototype.togglePanel = function(src, value) {

            if (panelStates[src] === value) {
                return
            }
            panelStates[src] = value;
            var _this = this;

            var category = ENUMS.Category.LOAD_CONTROLS;

            var buttonFunc = function(src, value) {
                setTimeout(function() {
                    _this.loadPiece(src, value)
                }, 10);
            };

            var first;

            if (!stateData) {
                stateData = {};
                first = true;
            }

            if (value) {
                console.log("Configs: ", PipelineAPI.getCachedConfigs());

                var list = PipelineAPI.readCachedConfigKey('PIECE_DATA', 'PIECES');

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

        return ControlLoader;
    });
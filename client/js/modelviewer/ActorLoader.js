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
        PieceState,
        ModuleStateViewer
    ) {

        var panels = {};
        var panelStates = {};
        var loadedModules = {};
        var rootModels = {};
        var stateData;

        var controledActor = null;

        function addButton() {
            var buttonEvent = {category:ENUMS.Category.STATUS, key:ENUMS.Key.ACTOR_LOADER, type:ENUMS.Type.toggle};

            var buttonConf = {
                panel:ENUMS.Gui.leftPanel,
                id:"actorloaderbutton",
                container:"editor_button_container",
                data:{
                    style:["panel_button", "coloring_button_main_panel"],
                    button:{
                        id:"panel_button",
                        event:buttonEvent
                    },
                    text:'ACTORS'
                }
            };

            PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {ACTOR_LOADER:true});

            evt.fire(evt.list().ADD_GUI_ELEMENT, {data:buttonConf});

            setTimeout(function() {
                PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {ACTOR_LOADER:false});
            }, 1000);

        }


        var ActorLoader = function() {
            this.running = false;
            this.panel = null;
            this.currentValue = 0;

            var _this=this;

            var apply = function(src, value) {
                setTimeout(function() {
                    _this.togglePanel(src, value)
                }, 100);
            };

            PipelineAPI.subscribeToCategoryKey(ENUMS.Category.STATUS, ENUMS.Key.ACTOR_LOADER, apply);

            addButton();

            var t = 0;

            var tick = function(e) {

                t += evt.args(e).tpf;

                for (var key in rootModels) {


                    if (rootModels[key].length) {

                        var actor = rootModels[key][0];

                        var piece = actor.piece;

                        for (var i = 0; i < piece.pieceSlots.length;i++) {

                            var mod = piece.pieceSlots[i].module;

                            var dataCat = "MODULE_DEBUG_"+mod.id;

                            for (var j = 0; j < mod.moduleChannels.length; j++) {
                                PipelineAPI.setCategoryKeyValue(dataCat, mod.moduleChannels[j].state.id, mod.moduleChannels[j].state.getValueRunded(100));
                            }
                        }
                    }
                }
            };

            evt.on(evt.list().CLIENT_TICK, tick);
        };


        ActorLoader.prototype.monitorPieceModules = function(piece, bool) {
            ModuleStateViewer.viewPieceStates(piece, bool);
        };


        ActorLoader.prototype.loadActor = function(id, value) {

            if (!loadedModules[id]) {
                loadedModules[id] = [];

                rootModels[id] = []
            }

            var _this = this;

            var onRemove = function(msg) {
                console.log("Removed Actor", msg)
            };

            if (value === true) {
                console.log("Load Model: ", id, value);

            //    if (rootModels[id].length) return;


                var ready = function(actor) {

                    GameAPI.addActor(actor);



                    if (actor.config.controls) {

                        if (controledActor) {
                            GameAPI.dropActorControl(controledActor);
                            controledActor = null;
                        }

                        GameAPI.controlActor(actor);
                        controledActor = actor;
                    };

                    rootModels[id].push(actor);
                    _this.monitorPieceModules(actor.piece, true);
                };

                GameAPI.createActor({dataKey:id}, ready);

            } else {


                if (rootModels[id]) {
                    if (controledActor) {

                    if (controledActor.dataKey === id) {
                        GameAPI.dropActorControl(controledActor);
                        controledActor = null;
                    }
                    }


                    while (rootModels[id].length) {
                        var p = rootModels[id].pop();
                        _this.monitorPieceModules(p.piece, false);
                    //    GameAPI.removeActor(p, onRemove);
                    }
                }
            }
        };


        ActorLoader.prototype.togglePanel = function(src, value) {

            if (panelStates[src] === value) {
                return
            }
            panelStates[src] = value;
            var _this = this;

            var category = ENUMS.Category.LOAD_ACTOR;

            var buttonFunc = function(src, value) {
                setTimeout(function() {
                    _this.loadActor(src, value)
                }, 10);
            };

            var first;

            if (!stateData) {
                stateData = {};
                first = true;
            }

            if (value) {
        //        console.log("Configs: ", PipelineAPI.getCachedConfigs());

                var list = PipelineAPI.readCachedConfigKey('PIECE_DATA', 'ACTORS');

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

        return ActorLoader;
    });
"use strict";


define([
        'Events',
        'PipelineAPI',
        'ThreeAPI',
        'ui/dom/DomSelectList'
    ],
    function(
        evt,
        PipelineAPI,
        ThreeAPI,
        DomSelectList
    ) {

        var panels = {};
        var panelStates = {};
        var loadedModels = {};
        var rootModels = {};
        var stateData;

        function addButton() {
            var buttonEvent = {category:ENUMS.Category.STATUS, key:ENUMS.Key.TERRAIN_LOADER, type:ENUMS.Type.toggle};

            var buttonConf = {
                panel:ENUMS.Gui.leftPanel,
                id:"terrainloaderbutton",
                container:"editor_button_container",
                data:{
                    style:["panel_button", "coloring_button_main_panel"],
                    button:{
                        id:"panel_button",
                        event:buttonEvent
                    },
                    text:'TERRAIN'
                }
            };

            PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {TERRAIN_LOADER:true});

            evt.fire(evt.list().ADD_GUI_ELEMENT, {data:buttonConf});

            setTimeout(function() {
                PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {TERRAIN_LOADER:false});
            }, 1000);

        }


        var TerrainLoader = function() {
            this.running = false;
            this.panel = null;
            this.currentValue = 0;

            var _this=this;

            var apply = function(src, value) {
                setTimeout(function() {
                    _this.toggleModelPanel(src, value)
                }, 100);
            };

            PipelineAPI.subscribeToCategoryKey(ENUMS.Category.STATUS, ENUMS.Key.TERRAIN_LOADER, apply);

            addButton();

            var pollwait = 5;
            var countdown = pollwait;

            var tick = function(e) {
                countdown -= evt.args(e).tpf;
                var reloadcount = 0;

                for (var key in loadedModels) {
                    if (loadedModels[key].length) {

                        if (countdown < 0) {
                            reloadcount++;
                        //    ThreeAPI.getModelLoader().loadModelId(key);
                        }
                        //    if (Math.random() < 0.1) {
                        evt.fire(evt.list().DRAW_POINT_AT, {pos:rootModels[key][0].position, color:'WHITE'});
                        //    }
                    }
                    countdown = 0.3 * reloadcount + 0.5;
                }
            };

            evt.on(evt.list().CLIENT_TICK, tick);

        };


        TerrainLoader.prototype.loadModel = function(modelId, value) {

            if (!loadedModels[modelId]) {
                loadedModels[modelId] = [];
                rootModels[modelId] = []
            }

            if (value === true) {
                console.log("Load Model: ", modelId, value);

                if (loadedModels[modelId].length) return;

                var rootObj = ThreeAPI.createRootObject();

                loadedModels[modelId].push(ThreeAPI.loadMeshModel(modelId, rootObj));

                rootModels[modelId].push(rootObj);

                ThreeAPI.addToScene(rootObj);

            } else {

                if (loadedModels[modelId]) {

                    while (loadedModels[modelId].length) {
                        ThreeAPI.removeModel(loadedModels[modelId].pop());
                    }

                    while (rootModels[modelId].length) {
                        ThreeAPI.hideModel(rootModels[modelId].pop());
                    }
                }
            }
        };


        TerrainLoader.prototype.toggleModelPanel = function(src, value) {

            if (panelStates[src] === value) {
                return
            }
            panelStates[src] = value;
            var _this = this;

            var category = ENUMS.Category.LOAD_TERRAIN

            var buttonFunc = function(src, value) {
                setTimeout(function() {
                    _this.loadModel(src, value)
                }, 10);
            };

            var first;

            if (!stateData) {
                stateData = {};
                first = true;
            }



            if (value) {
                console.log("Configs: ", PipelineAPI.getCachedConfigs());

                var dataList = ThreeAPI.getModelLoader().getModelList();

                panels[src] = new DomSelectList(category, dataList, stateData, buttonFunc);

            } else if (panels[src]) {

                panels[src].removeSelectList();
                delete panels[src];

            }

            if (first) {
                PipelineAPI.setCategoryData(category, stateData);
            }

        };


        return TerrainLoader;
    });
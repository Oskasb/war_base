"use strict";


define([
        'Events',
        'PipelineAPI',
        'ThreeAPI',
        'ui/GameScreen',
        'ui/dom/DomPanel'
    ],
    function(
        evt,
        PipelineAPI,
        ThreeAPI,
        GameScreen,
        DomPanel
    ) {

        var panels = {};
        var panelStates = {};

        var loadedModels = {};
        var rootModels = {};

        var stateData;

        var panelMap = {
            MODEL_LOADER:'select_panel'
        };

        function addButton() {
            var buttonEvent = {category:ENUMS.Category.STATUS, key:ENUMS.Key.MODEL_LOADER, type:ENUMS.Type.toggle};

            var buttonConf = {
                panel:ENUMS.Gui.leftPanel,
                id:"modelloaderbutton",
                container:"main_container",
                data:{
                    style:["panel_button", "coloring_button_main_panel"],
                    button:{
                        id:"panel_button",
                        event:buttonEvent
                    },
                    text:'VIEW MODEL'
                }
            };

            PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {MODEL_LOADER:1});

            evt.fire(evt.list().ADD_GUI_ELEMENT, {data:buttonConf});

        }


        var ModelLoader = function() {
            this.running = false;
            this.panel = null;
            this.currentValue = 0;

            var _this=this;

            var apply = function(src, value) {
                setTimeout(function() {
                    _this.toggleModelPanel(src, value)
                }, 100);
            };

            PipelineAPI.subscribeToCategoryKey(ENUMS.Category.STATUS, ENUMS.Key.MODEL_LOADER, apply);







            addButton();
        };


        ModelLoader.prototype.toggleModelPanel = function(src, value) {

            if (panelStates[src] === value) {
                return
            }

            panelStates[src] = value;

            if (value == 1) {
                console.log("Configs: ", PipelineAPI.getCachedConfigs());

                panels[src] = new DomPanel(GameScreen.getElement(), panelMap[src]);

                var modelList = ThreeAPI.getModelLoader().getModelList();

                this.populatePanelButtons(panels[src], modelList);

            } else if (panels[src]) {

                panels[src].removeGuiPanel();
                delete panels[src];

            }
            
        };

        ModelLoader.prototype.populatePanelButtons = function(panel, modelList) {
            console.log("Models:", panel, modelList);

            var first;

            if (!stateData) {
                stateData = {};
                first = true;
            }

            for (var key in modelList) {
                this.addLoadModelButton(panel, key, modelList[key])
            }

            panel.updateLayout();

            if (first) {
                PipelineAPI.setCategoryData(ENUMS.Category.LOAD_MODEL, stateData);
            }

        };

        ModelLoader.prototype.loadModel = function(modelId, value) {


            if (value == 1) {
                console.log("Load Model: ", modelId, value);

                var rootObj = ThreeAPI.createRootObject();

                if (!loadedModels[modelId]) {
                    loadedModels[modelId] = [];
                    rootModels[modelId] = []
                }

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

        ModelLoader.prototype.addLoadModelButton = function(panel, modelId) {

            var buttonEvent = {category:ENUMS.Category.LOAD_MODEL, key:modelId, type:ENUMS.Type.toggle};

            var containerConf = {
                id:modelId+"_container",
                data:{
                    parentId:"panelRoot",
                    style:["select_button_container", "coloring_container_dev_panel"]
                }
            };

            var buttonConf = {
                panel:panel.panelId,
                id:"button",
            //    container:"panel_select_container",
                data:{
                    parentId:containerConf.id,
                    style:["select_panel_button", "coloring_button_dev_panel"],
                    button:{
                        id:"dev_panel_button",
                        event:buttonEvent
                    },
                    text:modelId
                }
            };

            if (!stateData[modelId]) {
                stateData[modelId] = false;
            }

        //    PipelineAPI.setCategoryKeyValue(ENUMS.Category.LOAD_MODEL, modelId, stateData[modelId]);

            var container = panel.attachElement(panel.panelId, containerConf);
            panel.attachElement(container, buttonConf);

            var _this = this;

            var apply = function(src, value) {
                setTimeout(function() {
                    _this.loadModel(src, value)
                }, 10);
            };

            PipelineAPI.subscribeToCategoryKey(ENUMS.Category.LOAD_MODEL, modelId, apply);

        };

        return ModelLoader;
    });
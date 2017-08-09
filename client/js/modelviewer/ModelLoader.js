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
                    text:'MODEL LIST'
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


        ModelLoader.prototype.loadModel = function(modelId, value) {


            if (value === true) {
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


        ModelLoader.prototype.toggleModelPanel = function(src, value) {

            if (panelStates[src] === value) {
                return
            }
            panelStates[src] = value;
            var _this = this;

            var category = ENUMS.Category.LOAD_MODEL

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


        return ModelLoader;
    });
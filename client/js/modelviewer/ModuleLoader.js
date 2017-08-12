"use strict";


define([
        'Events',
        'PipelineAPI',
        'ThreeAPI',
        'ui/dom/DomSelectList',
        'game/GameModule'
    ],
    function(
        evt,
        PipelineAPI,
        ThreeAPI,
        DomSelectList,
        GameModule
    ) {

        var panels = {};
        var panelStates = {};
        var loadedModules = {};
        var rootModels = {};
        var stateData;

        function addButton() {
            var buttonEvent = {category:ENUMS.Category.STATUS, key:ENUMS.Key.MODULE_LOADER, type:ENUMS.Type.toggle};

            var buttonConf = {
                panel:ENUMS.Gui.leftPanel,
                id:"moduleloaderbutton",
                container:"main_container",
                data:{
                    style:["panel_button", "coloring_button_main_panel"],
                    button:{
                        id:"panel_button",
                        event:buttonEvent
                    },
                    text:'MODULES'
                }
            };

            PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {MODULE_LOADER:true});

            evt.fire(evt.list().ADD_GUI_ELEMENT, {data:buttonConf});

            setTimeout(function() {
                PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {MODULE_LOADER:false});
            }, 1000);

        }


        var ModuleLoader = function() {
            this.running = false;
            this.panel = null;
            this.currentValue = 0;

            var _this=this;

            var apply = function(src, value) {
                setTimeout(function() {
                    _this.togglePanel(src, value)
                }, 100);
            };

            PipelineAPI.subscribeToCategoryKey(ENUMS.Category.STATUS, ENUMS.Key.MODULE_LOADER, apply);

            addButton();

            var tick = function(e) {

                for (var key in loadedModules) {
                    if (loadedModules[key].length) {
                        loadedModules[key][0].sampleModuleFrame(evt.args(e).tpf);
                    }
                }
            };

            evt.on(evt.list().CLIENT_TICK, tick);

        };


        ModuleLoader.prototype.loadModule = function(id, value) {

            if (!loadedModules[id]) {
                loadedModules[id] = [];

                rootModels[id] = []
            }

            if (value === true) {
                console.log("Load Model: ", id, value);

                if (loadedModules[id].length) return;

                var rootObj = ThreeAPI.createRootObject();

                var ready = function(mod) {
                    mod.monitorGameModule(true);
                };

                var module = new GameModule(id, ready);

                module.attachModuleToParent(rootObj);

                loadedModules[id].push(module);

                rootModels[id].push(rootObj);

                ThreeAPI.addToScene(rootObj);

            } else {

                if (loadedModules[id]) {

                    while (loadedModules[id].length) {
                        loadedModules[id].pop().removeClientModule();
                    }

                    while (rootModels[id].length) {
                        ThreeAPI.hideModel(rootModels[id].pop());
                    }
                }
            }
        };


        ModuleLoader.prototype.togglePanel = function(src, value) {

            if (panelStates[src] === value) {
                return
            }
            panelStates[src] = value;
            var _this = this;

            var category = ENUMS.Category.LOAD_MODULE;

            var buttonFunc = function(src, value) {
                setTimeout(function() {
                    _this.loadModule(src, value)
                }, 10);
            };

            var first;

            if (!stateData) {
                stateData = {};
                first = true;
            }

            if (value) {
                console.log("Configs: ", PipelineAPI.getCachedConfigs());

                var list = PipelineAPI.readCachedConfigKey('MODULE_DATA', 'MODULES');

                var dataList = {};

                for (var i = 0; i < list.length; i++) {
                    dataList[list[i].id] = list[i];
                }

                panels[src] = new DomSelectList(category, dataList, stateData, buttonFunc);

            } else if (panels[src]) {

                panels[src].removeSelectList();
                delete panels[src];

            }

            if (first) {
                PipelineAPI.setCategoryData(category, stateData);
            }

        };


        return ModuleLoader;
    });
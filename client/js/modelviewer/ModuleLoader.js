"use strict";


define([
        'Events',
        'PipelineAPI',
        'ThreeAPI',
        'ui/dom/DomSelectList',
        'ui/dom/DomPanel',
        'ui/GameScreen',
        'game/GameModule',
        'game/PieceState'
    ],
    function(
        evt,
        PipelineAPI,
        ThreeAPI,
        DomSelectList,
        DomPanel,
        GameScreen,
        GameModule,
        PieceState
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

            var t = 0;

            var tick = function(e) {

                t += evt.args(e).tpf;

                for (var key in loadedModules) {
                    if (loadedModules[key].length) {
                        var mod = loadedModules[key][0];

                        var dataCat = "MODULE_DEBUG_"+mod.id;

                        for (var i = 0; i < mod.moduleChannels.length; i++) {
                            mod.moduleChannels[i].state.setValue(Math.sin(t))
                            PipelineAPI.setCategoryKeyValue(dataCat, mod.moduleChannels[i].state.id, mod.moduleChannels[i].state.getValueRunded(100));
                        }

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

            var _this = this;

            if (value === true) {
                console.log("Load Model: ", id, value);

                if (loadedModules[id].length) return;


                var ready = function(mod) {

                    for (var i = 0; i < mod.moduleChannels.length; i++) {
                        mod.moduleChannels[i].attachPieceState(new PieceState(mod.moduleChannels[i].stateid), 0)
                    }

                    var rootObj = ThreeAPI.createRootObject();
                    mod.attachModuleToParent(rootObj);

                    loadedModules[mod.id].push(mod);

                    rootModels[mod.id].push(rootObj);

                    ThreeAPI.addToScene(rootObj);
                    mod.monitorGameModule(true);
                    _this.toggleModuleStateViewer(mod, true);
                };

                new GameModule(id, ready);

            } else {

                if (loadedModules[id]) {

                    while (loadedModules[id].length) {
                        var mod = loadedModules[id].pop()
                        _this.toggleModuleStateViewer(mod, false);
                        mod.removeClientModule();
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

            setTimeout(function() {
                _this.toggleStateViewer(value);
            },200);


            if (first) {
                PipelineAPI.setCategoryData(category, stateData);
            }
        };

        ModuleLoader.prototype.toggleModuleStateViewer = function(mod, bool) {

            var src = 'state_viewer';



            function addModuleBox(module) {

                var modState = {};

                var dataKeys = [];

                for (var i = 0; i < module.moduleChannels.length; i++) {
                    dataKeys[i] = module.moduleChannels[i].state.id;
                    modState[dataKeys[i]] = module.state;
                }

                dataKeys.unshift(mod.id);

                var dataCat = "MODULE_DEBUG_"+module.id;

                var idconf = {
                    id:"module_id"+module.id,
                    container:"dev_monitor_container",
                    data:{
                        style:["data_list_container"],
                        dataField:{
                            dataKeys:dataKeys,
                            dataCategory:dataCat
                        }
                    }
                };

                panels[src].addContainedElement(idconf);
                panels[src].updateLayout()
            //    evt.fire(evt.list().ADD_GUI_ELEMENT, {data:buttonConf});
            }

            if (bool) {
                addModuleBox(mod);
            } else {
                var container = {
                    id:"module_id"+mod.id
                };

                panels[src].removeContainedElement(container)
            }

        };


        ModuleLoader.prototype.toggleStateViewer = function(value) {

            var src = 'state_viewer';

            if (value) {
                console.log("toggleStateViewer: ", value);

                panels[src] = new DomPanel(GameScreen.getElement(), src);

            } else if (panels[src]) {
                panels[src].removeGuiPanel();
                delete panels[src];
            }

        };

        return ModuleLoader;
    });
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
        var stateData;

        function addButton() {
            var buttonEvent = {category:ENUMS.Category.STATUS, key:ENUMS.Key.ENV_LOADER, type:ENUMS.Type.toggle};

            var buttonConf = {
                panel:ENUMS.Gui.leftPanel,
                id:"environmentloaderbutton",
                container:"main_container",
                data:{
                    style:["panel_button", "coloring_button_main_panel"],
                    button:{
                        id:"panel_button",
                        event:buttonEvent
                    },
                    text:'ENV'
                }
            };

            PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {ENV_LOADER:1});
            evt.fire(evt.list().ADD_GUI_ELEMENT, {data:buttonConf});

        }


        var EnvironmentLoader = function() {
            this.running = false;
            this.panel = null;
            this.currentValue = ThreeAPI.getEnvironment().getCurrentEnvId();


            var _this=this;

            var apply = function(src, value) {
                setTimeout(function() {
                    _this.toggleEnvPanel(src, value)
                }, 100);
            };

            PipelineAPI.subscribeToCategoryKey(ENUMS.Category.STATUS, ENUMS.Key.ENV_LOADER, apply);
            addButton();
        };

        EnvironmentLoader.prototype.loadEnv = function(src, value, category) {

            stateData[src] = value;

            var disable = false

        //    for (var key in stateData) {
        //        if (key != src) {

        //        }
        //    }

            if (value) {
                console.log("Set Env Conf:", src, value);

                if (src != this.currentValue) {
                    PipelineAPI.setCategoryKeyValue(category, this.currentValue, false);
                }

                ThreeAPI.getEnvironment().setEnvConfigId(src);
                ThreeAPI.getEnvironment().enableEnvironment();
                this.currentValue = src;

            } else  {

                if (src === ThreeAPI.getEnvironment().getCurrentEnvId()) {
                   ThreeAPI.getEnvironment().disableEnvironment();
                }

            }

        //    PipelineAPI.setCategoryData(category, stateData);

        };

        EnvironmentLoader.prototype.toggleEnvPanel = function(src, value) {

            if (panelStates[src] === value) {
                return
            }

            panelStates[src] = value;
            var _this = this;

            var category = ENUMS.Category.LOAD_ENVIRONMENT;

            var buttonFunc = function(src, value) {
                setTimeout(function() {
                    _this.loadEnv(src, value, category)
                }, 10);
            };

            var first;

            if (!stateData) {
                stateData = {};
                stateData[this.currentValue] = true;
                first = true;
            }

            if (value) {
                var dataList = ThreeAPI.getEnvironment().getEnvConfigs();

                panels[src] = new DomSelectList(category, dataList, stateData, buttonFunc);

            } else if (panels[src]) {

                panels[src].removeSelectList();
                delete panels[src];

            }

            if (first) {
                PipelineAPI.setCategoryData(category, stateData);
            }

        };

        return EnvironmentLoader;

    });
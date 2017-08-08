"use strict";


define([
        'Events',
        'PipelineAPI',
        'ThreeAPI'
    ],
    function(
        evt,
        PipelineAPI,
        ThreeAPI
    ) {

        var panelStates = {};

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
            this.currentValue = 0;

            var _this=this;

            var apply = function(src, value) {
                setTimeout(function() {
                    _this.toggleEnv(src, value)
                }, 100);
            };

            PipelineAPI.subscribeToCategoryKey(ENUMS.Category.STATUS, ENUMS.Key.ENV_LOADER, apply);
            addButton();
        };


        EnvironmentLoader.prototype.toggleEnv = function(src, value) {

            if (panelStates[src] === value) {
                return
            }

            panelStates[src] = value;

            if (value == 1) {
                ThreeAPI.getEnvironment().enableEnvironment();
            } else  {
                ThreeAPI.getEnvironment().disableEnvironment();
            }

        };

        return EnvironmentLoader;

    });
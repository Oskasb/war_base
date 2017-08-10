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

        function addElement() {

            var elemConf = {
                panel:ENUMS.Gui.leftPanel,
                id:"inputSelectMonitor",
                data: {
                    canvas3d: {
                        configId: "canvas_input_select"
                    }
                }
            };

        //    PipelineAPI.setCategoryData(ENUMS.Category.STATUS, {MODEL_LOADER:1});

            evt.fire(evt.list().ADD_GUI_ELEMENT, {data:elemConf});
        }

        var ViewerPointer = function() {
            this.running = false;
            this.panel = null;
            this.currentValue = 0;

            addElement();
        };

        return ViewerPointer;
    });
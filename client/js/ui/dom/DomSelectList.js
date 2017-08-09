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

        var DomSelectList = function(category, dataList, stateData, buttonFunc) {

            this.panel = new DomPanel(GameScreen.getElement(), 'select_panel');
            this.populatePanelButtons(this.panel, category, dataList, stateData, buttonFunc)

        };

        DomSelectList.prototype.populatePanelButtons = function(panel, category, dataList, stateData, buttonFunc) {
            console.log("Select List:", panel, dataList);

            for (var key in dataList) {
                this.addListButton(panel, category, key, stateData, buttonFunc)
            }

            panel.updateLayout();
        };


        DomSelectList.prototype.addListButton = function(panel, category, key, stateData, buttonFunc) {

            var buttonEvent = {category:category, key:key, type:ENUMS.Type.toggle};

            var containerConf = {
                id:key+"_container",
                data:{
                    parentId:"panelRoot",
                    style:["select_button_container", "coloring_container_dev_panel"]
                }
            };

            var buttonConf = {
                panel:panel.panelId,
                id:"button",
                data:{
                    parentId:containerConf.id,
                    style:["select_panel_button", "coloring_button_dev_panel"],
                    button:{
                        id:"dev_panel_button",
                        event:buttonEvent
                    },
                    text:key
                }
            };

            if (!stateData[key]) {
                stateData[key] = false;
            }

            var container = panel.attachElement(panel.panelId, containerConf);
            panel.attachElement(container, buttonConf);

            var apply = function(src, value) {
                buttonFunc(src, value)
            };

            PipelineAPI.subscribeToCategoryKey(category, key, apply);
        };

        DomSelectList.prototype.removeSelectList = function() {
            this.panel.removeGuiPanel();
        };

        return DomSelectList;
    });
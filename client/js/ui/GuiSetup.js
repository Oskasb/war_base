"use strict";


define([
        'Events',
        'PipelineAPI',
        'ui/dom/DomPanel'
    ],
    function(
        evt,
        PipelineAPI,
        DomPanel
    ) {

        var panels = {};

        var GuiSetup = function() {
            this.active = true;
        };

        GuiSetup.prototype.initMainGui = function() {

            this.registerGuiListener()
        };


        GuiSetup.prototype.registerGuiListener = function() {
            var _this = this;
            var addElement = function(e) {
        //        _this.addElement(evt.args(e).data.panel, evt.args(e).data)
            };
        //    PipelineAPI.subscribeToCategoryKey(ENUMS.Category.GUI_ELEMENT, ENUMS.Key.ADD, addElement);

            evt.on(evt.list().ADD_GUI_ELEMENT, addElement);


            var removeElement = function(e) {
                _this.removeElement(evt.args(e).data.panel, evt.args(e).data)
            };
         //   PipelineAPI.subscribeToCategoryKey(ENUMS.Category.GUI_ELEMENT, ENUMS.Key.REMOVE, removeElement);
            evt.on(evt.list().REMOVE_GUI_ELEMENT, removeElement);
        };

        GuiSetup.prototype.addElement = function(panel, config) {
            panels[panel].addContainedElement(config);
        };

        GuiSetup.prototype.removeElement = function(panel, config) {
            panels[panel].removeContainedElement(config);
        };

        GuiSetup.prototype.removeMainGui = function() {
            this.active = false;
            panels[ENUMS.Gui.rightPanel].removeGuiPanel();
            panels[ENUMS.Gui.leftPanel].removeGuiPanel();
            delete this;
        };

        GuiSetup.prototype.tickTextRenderer = function(tpf) {

        };

        return GuiSetup;

    });




"use strict";


define([
        'PipelineObject'
    ],
    function(
        PipelineObject
    ) {

        var count = 0;

        var guiRendererCallbacks;

        var GuiElement = function(dataKey, ready) {

            count++;

            this.elementId = dataKey+'_'+count;

            this.enabled = false;
            this.position = new THREE.Vector3();
            this.dataKey = dataKey;

            var applyData = function() {
                this.applyData(this.pipeObj.buildConfig()[dataKey], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('GUI_PARTICLE_ELEMENTS', 'ELEMENTS', applyData, dataKey);
        };

        GuiElement.prototype.applyData = function (config, ready) {
            this.config = config;

            this.disableFunc = config.gui_render_disable;
            this.enableFunc = config.gui_render_enable;
            this.renderFunc = config.gui_renderer_callback;
            this.fxId = config.effect_id;

            ready(this)
        };


        GuiElement.prototype.enableGuiElement = function() {
            this.enabled = true;
            guiRendererCallbacks[this.enableFunc](this.elementId, this.position, this.fxId);
        };

        GuiElement.prototype.disableGuiElement = function() {
            this.enabled = false;
            guiRendererCallbacks[this.disableFunc](this.elementId);
        };

        GuiElement.prototype.updateGuiElement = function(guiCallbacks) {
            guiRendererCallbacks = guiCallbacks;
            guiRendererCallbacks[this.renderFunc](this);
        };

        GuiElement.prototype.applyElementPosition = function() {
            guiRendererCallbacks.setElementPosition(this.elementId, this.position)
        };

        GuiElement.prototype.removeGuiElement = function () {
            this.pipeObj.removePipelineObject();
        };

        return GuiElement
    });
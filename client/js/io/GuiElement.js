
"use strict";


define([
        'PipelineObject'
    ],
    function(
        PipelineObject
    ) {

        var count = 0;

        var guiRendererCallbacks;
        var calcVec = new THREE.Vector3();

        var GuiElement = function(dataKey, ready) {

            count++;

            this.elementId = dataKey+'_'+count;

            this.fxElements = [];

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
            this.fxIds = config.effect_ids;

            ready(this)
        };


        GuiElement.prototype.enableGuiElement = function() {
            this.enabled = true;


            for (var i = 0; i < this.fxIds.length; i++) {
                guiRendererCallbacks[this.enableFunc](this.elementId, this.position, this.fxIds[i], this.fxElements);
            }
        };

        GuiElement.prototype.disableGuiElement = function() {
            this.enabled = false;
            guiRendererCallbacks[this.disableFunc](this.fxElements);
        };

        GuiElement.prototype.updateGuiElement = function(guiCallbacks) {
            guiRendererCallbacks = guiCallbacks;
            guiRendererCallbacks[this.renderFunc](this);
        };

        GuiElement.prototype.applyElementPosition = function(fxIndex, offsetVec3) {
            if (offsetVec3) {
                calcVec.addVectors(this.position, offsetVec3);
                guiRendererCallbacks.setElementPosition(this.fxElements[fxIndex], calcVec);
            } else {
                guiRendererCallbacks.setElementPosition(this.fxElements[fxIndex], this.position);
            }
        };

        GuiElement.prototype.removeGuiElement = function () {
            this.pipeObj.removePipelineObject();
        };

        return GuiElement
    });
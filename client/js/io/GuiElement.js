
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

            this.children = {};

            this.enabled = false;
            this.position = new THREE.Vector3();
            this.origin   = new THREE.Vector3();
            this.dataKey = dataKey;

            var applyData = function() {
                this.applyData(this.pipeObj.buildConfig()[dataKey], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('GUI_PARTICLE_ELEMENTS', 'ELEMENTS', applyData, dataKey);
        };

        GuiElement.prototype.applyData = function (config, ready) {
            this.config = config;

            this.disableFunc = config.render_calls.gui_render_disable;
            this.enableFunc = config.render_calls.gui_render_enable;
            this.renderFunc = config.render_calls.gui_renderer_callback;
            this.updateFunc = config.render_calls.gui_update_callback;
            this.options = config.options;
            this.fxIds = config.effect_ids;

            ready(this)
        };

        GuiElement.prototype.spawnChildElement = function(fxId) {
            var callback = function(element) {
                if (!this.children[element.dataKey]) {
                    this.children[element.dataKey] = [];
                }
                element.enableGuiElement();
                this.children[element.dataKey].push(element);
            }.bind(this);

            guiRendererCallbacks.generateChildElement(fxId, callback)
        };

        GuiElement.prototype.despawnChildElement = function(child) {
            child.disableGuiElement();
            guiRendererCallbacks.removeChildElement(child)
        };

        GuiElement.prototype.enableGuiElement = function() {
            this.enabled = true;

            for (var i = 0; i < this.fxIds.length; i++) {
                guiRendererCallbacks[this.enableFunc](this, i);
            }
        };

        GuiElement.prototype.disableGuiElement = function() {
            this.enabled = false;
            guiRendererCallbacks[this.disableFunc](this.fxElements);

            for (var key in this.children) {
                while (this.children[key].length) {
                    this.despawnChildElement(this.children[key].pop());
                }
            }
        };

        GuiElement.prototype.updateGuiElement = function(guiCallbacks) {
            guiRendererCallbacks = guiCallbacks;
            if (this.renderFunc) {
                guiRendererCallbacks[this.renderFunc](this);
            }
        };

        GuiElement.prototype.applyElementPosition = function(fxIndex, offsetVec3) {
            if (offsetVec3) {
                this.position.addVectors(this.origin, offsetVec3);
            } else {
                this.position.copy(this.origin);
            }
            guiRendererCallbacks[this.updateFunc](this, this.fxElements[fxIndex]);
        };

        GuiElement.prototype.removeGuiElement = function () {
            this.pipeObj.removePipelineObject();
        };

        return GuiElement
    });
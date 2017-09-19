
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

            this.spriteKey = null;
            this.children = {};

            this.enabled = false;
            this.position = new THREE.Vector3();
            this.origin   = new THREE.Vector3();
            this.textOffsetVec = new THREE.Vector3();
            this.requestedChildren = 0;
            this.dataKey = dataKey;

            this.target = null;
            this.text = '';
            this.letter = '';

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

        GuiElement.prototype.setText = function(text) {
            if (this.text !== text || Math.random() < 0.1) {
                this.generateChildrenForText(text);
            }
            this.text = text;
        };


        GuiElement.prototype.generateChildrenForText = function(text) {

            var childCount = this.requestedChildren;

            if (this.children[this.options.text_element_id]) {
                childCount += this.children[this.options.text_element_id].length;
            }

            var elemCountDiff = text.length - childCount;

            if (!elemCountDiff) return;

            if (elemCountDiff < 0) {
                if (this.children[this.options.text_element_id]) {
                    while (this.requestedChildren + this.children[this.options.text_element_id].length > text.length) {
                        this.despawnChildElement(this.children[this.options.text_element_id].pop());
                    }
                }

            } else if (elemCountDiff > 0) {
                for (var i = this.text.length; i < text.length; i++) {
                    this.spawnChildElement(this.options.text_element_id);
                }
            }
        };

        GuiElement.prototype.renderText = function(textOffsetVector) {

            var txElemId = this.options.text_element_id;
            var child;

            this.textOffsetVec.copy(textOffsetVector);

            this.textOffsetVec.x += this.options.pad_x || 0;
            this.textOffsetVec.y += this.options.pad_y || 0;

            if (this.children[txElemId]) {

                for (var i = 0; i < this.children[txElemId].length; i++) {
                    var letter = this.text[i];

                    child = this.children[txElemId][i];
                    child.origin.copy(this.position);


                    if (child.letter !== letter) {
                        child.setSpriteKey(this.text[i]);
                        child.letter = this.text[i];
                    }

                    child.applyElementPosition(null, this.textOffsetVec);

                    this.textOffsetVec.z = 0;

                    this.textOffsetVec.x += child.options.step_x;
                }
            }
        };

        GuiElement.prototype.setTarget = function(target) {
            if (this.target !== target) {
                this.disableGuiElement();
            }
            this.target = target;
        };

        GuiElement.prototype.setSpriteKey = function(spriteKey) {
            if (this.spriteKey !== spriteKey) {
                this.updateRenderingSpriteKey(spriteKey);
            }
            this.spriteKey = spriteKey;
        };

        GuiElement.prototype.updateRenderingSpriteKey = function(spriteKey) {
            guiRendererCallbacks.updateElementsSpriteKey(this.fxElements, spriteKey)
        };


        GuiElement.prototype.getTarget = function() {
            return this.target;
        };

        GuiElement.prototype.spawnChildElement = function(fxId) {
            var callback = function(element) {
                if (!this.children[element.dataKey]) {
                    this.children[element.dataKey] = [];
                }
                element.enableGuiElement(guiRendererCallbacks);
                this.children[element.dataKey].push(element);
                this.requestedChildren--;
            }.bind(this);

            this.requestedChildren++;
            guiRendererCallbacks.generateChildElement(fxId, callback)
        };

        GuiElement.prototype.despawnChildElement = function(child) {
            child.disableGuiElement();
            guiRendererCallbacks.removeChildElement(child)
        };

        GuiElement.prototype.enableGuiElement = function(guiCallbacks) {
            if (guiCallbacks) {
                guiRendererCallbacks = guiCallbacks;
            }

            this.enabled = true;

            for (var i = 0; i < this.fxIds.length; i++) {
                guiRendererCallbacks[this.enableFunc](this, i);
            }
        };

        GuiElement.prototype.removeChildren = function() {
            for (var key in this.children) {
                while (this.children[key].length) {
                    this.despawnChildElement(this.children[key].pop());
                }
            }
        };

        GuiElement.prototype.disableGuiElement = function() {
            this.enabled = false;
            this.spriteKey = null;
            guiRendererCallbacks[this.disableFunc](this.fxElements);
            this.removeChildren();
        };

        GuiElement.prototype.updateGuiElement = function(guiCallbacks) {
            guiRendererCallbacks = guiCallbacks;
            if (this.renderFunc) {
                guiRendererCallbacks[this.renderFunc](this);
            }
        };

        GuiElement.prototype.applyElementPosition = function(fxIndex, offsetVec3) {
            if (!guiRendererCallbacks) return;

            if (offsetVec3) {
                this.position.addVectors(this.origin, offsetVec3);
            } else {
                if (Math.random() < 0.999 && this.position.x === this.origin.x && this.position.y === this.origin.y && this.position.z === this.origin.z) {
                    return;
                }
                this.position.copy(this.origin);
            }

            if (fxIndex !== null) {
                guiRendererCallbacks[this.updateFunc](this, this.fxElements[fxIndex]);
            } else {
                for (var i = 0; i < this.fxElements.length; i++) {
                    guiRendererCallbacks[this.updateFunc](this, this.fxElements[i]);
                }
            }
        };

        GuiElement.prototype.removeGuiElement = function () {
            this.pipeObj.removePipelineObject();
        };

        return GuiElement
    });
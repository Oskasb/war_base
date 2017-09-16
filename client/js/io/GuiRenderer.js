"use strict";

define([
    'ThreeAPI',
    'PipelineAPI',
        'io/GuiRendererCallbacks',
        'io/GuiElement',
        'application/ExpandingPool'
    ],
    function(
        ThreeAPI,
        PipelineAPI,
        GuiRendererCallbacks,
        GuiElement,
        ExpandingPool
    ) {

        var mouseState;

        var guiRendererCallbacks;

        var GameAPI;

        var expandingPools = {};

        var guiElements = [];

        function createElementByDataKey(dataKey, onReadyCB) {
            new GuiElement(dataKey, onReadyCB)
        }

        var GuiRenderer = function(gameApi) {
            GameAPI = gameApi;
            guiRendererCallbacks = new GuiRendererCallbacks(GameAPI);

            this.generateGuiElements();


            var fetchPointer = function(src, data) {
                mouseState = data;
            };

            PipelineAPI.subscribeToCategoryKey('POINTER_STATE', 'mouseState', fetchPointer);

        };


        GuiRenderer.prototype.getGuiElement = function(dataKey, callback) {

            if (!expandingPools[dataKey]) {
                expandingPools[dataKey] = new ExpandingPool(dataKey, createElementByDataKey);
            }

            expandingPools[dataKey].getFromExpandingPool(callback);
        };

        GuiRenderer.prototype.removeGuiElement = function(actor) {
            expandingPools[actor.dataKey].returnToExpandingPool(actor);
        };


        GuiRenderer.prototype.generateGuiElements = function() {

            var elementReady = function(guiElement) {
                guiElements.push(guiElement);
                console.log("Gui Element Ready", guiElement);
            };

            var guiElemData = function(src, data) {
                for (var i = 0; i < data.length; i++) {
                    this.getGuiElement(data[i].id, elementReady);
                }
            }.bind(this);

            PipelineAPI.subscribeToCategoryKey('GUI_PARTICLE_ELEMENTS', 'ELEMENTS', guiElemData)
        };


        GuiRenderer.prototype.requestCameraMatrixUpdate = function() {
            ThreeAPI.updateCamera();
        };

        GuiRenderer.prototype.updateGuiRenderer = function() {

            guiRendererCallbacks.updateMouseState(mouseState);

            for (var i = 0; i < guiElements.length; i++) {
                guiElements[i].updateGuiElement(guiRendererCallbacks);
            }

        };

        return GuiRenderer;

    });
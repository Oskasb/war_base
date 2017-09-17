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

        var combatElemId = "gui_combat_plate_element";

        var expandingPools = {};

        var guiElements = [];

        var combatStatusElements = [];

        function createElementByDataKey(dataKey, onReadyCB) {
            new GuiElement(dataKey, onReadyCB)
        }

        var GuiRenderer = function(gameApi) {
            GameAPI = gameApi;
            guiRendererCallbacks = new GuiRendererCallbacks(this, GameAPI);

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

        GuiRenderer.prototype.removeGuiElement = function(guiElement) {
            expandingPools[guiElement.dataKey].returnToExpandingPool(guiElement);
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

        var addBombatElementCB = function(element) {
            combatStatusElements.push(element);
        };

        GuiRenderer.prototype.addCombatElement = function() {
            this.getGuiElement(combatElemId, addBombatElementCB)

        };

        GuiRenderer.prototype.getActorCombatElement = function(actor) {

            var available = -1;

            for (var i = 0; i < combatStatusElements.length; i++) {
                var target = combatStatusElements[i].getTarget();
                if (target === actor) {
                    return combatStatusElements[i];
                }

                if (!target) {
                    available = i;
                }
            }

            if (available > -1) {
                combatStatusElements[available].setTarget(actor);
                return combatStatusElements[available];
            }

            this.addCombatElement();
        };

        GuiRenderer.prototype.updateGuiRenderer = function() {

            guiRendererCallbacks.updateMouseState(mouseState);

            for (var i = 0; i < guiElements.length; i++) {
                guiElements[i].updateGuiElement(guiRendererCallbacks);
            }

            var actors = GameAPI.getActors();
            /*
                   var actor = GameAPI.getSelectionActivatedActor();

                   if (actor) {
                       var combatElem = this.getActorCombatElement(actor);
                       if (combatElem) {
                           combatElem.updateGuiElement(guiRendererCallbacks)                  }
                   }


                   */

                   for (var i = 0; i < actors.length; i++) {

                       if (actors[i].piece.getCombatStatus()) {
                           var combatElem = this.getActorCombatElement(actors[i]);
                           if (combatElem) {
                               combatElem.updateGuiElement(guiRendererCallbacks);
                           }
                       }
                   }

        };

        return GuiRenderer;

    });
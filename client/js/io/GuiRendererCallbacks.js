"use strict";

define([
        'ui/GameScreen',
        'io/GuiFeedbackFunctions'
    ],
    function(
        GameScreen,
        GuiFeedbackFunctions
    ) {

        var GameAPI;
        var mouseState;
        var calcVec = new THREE.Vector3();
        var cursorElementId = 'gui_cursor_pointer_follow';
        var cursorEeffectId = 'gui_pointer_follow_effect';


        var GuiRendererCallbacks = function(gameApi) {
            GameAPI = gameApi
            this.guiFeedbackFunctions = new GuiFeedbackFunctions();
            this.cursorElement = null;
        };


        GuiRendererCallbacks.prototype.fitView = function(vec3) {
            vec3.x *= (0.82 * GameScreen.getAspect());
            vec3.y *= (0.82);
        };


        GuiRendererCallbacks.prototype.pxXtoPercentX = function(x) {
            return 100*x/GameScreen.getWidth()
        };

        GuiRendererCallbacks.prototype.pxYtoPercentY = function(y) {
            return 100*y/GameScreen.getHeight();
        };

        GuiRendererCallbacks.prototype.transformConnector = function(x1, y1, x2, y2, distance, zrot) {

        };

        GuiRendererCallbacks.prototype.showDragToPoint = function(x, y, distance, angle) {

        };

        GuiRendererCallbacks.prototype.showStartDragPoint = function(x, y, distance, angle) {

        };

        GuiRendererCallbacks.prototype.enable_fx_element = function(cursorElementId, pointerFrustumPos, cursorEeffectId, fxStore) {
            return this.guiFeedbackFunctions.enableElement(cursorElementId, pointerFrustumPos, cursorEeffectId, fxStore);
        };

        GuiRendererCallbacks.prototype.disable_fx_element = function(fxStore) {
            this.guiFeedbackFunctions.disableElement(fxStore);
        };

        GuiRendererCallbacks.prototype.setElementPosition = function(fxElement, pointerPos) {
            this.guiFeedbackFunctions.updateElementPosition(fxElement, pointerPos);
        };

        GuiRendererCallbacks.prototype.show_selection_corners = function(guiElement) {

            var activeSelection = GameAPI.getSelectionActivatedActor();

            if (activeSelection) {

                if (!guiElement.enabled) {
                    guiElement.enableGuiElement();
                }

                guiElement.position.copy(activeSelection.piece.frustumCoords);
                this.fitView(guiElement.position);

                var distance = activeSelection.piece.cameraDistance;
                var size = activeSelection.piece.boundingSize;

                var factor = Math.clamp(size / (distance), 0.03, 0.3);

                calcVec.z = 0;

                calcVec.x = factor;

                calcVec.y = factor;
                guiElement.applyElementPosition(0, calcVec);

                calcVec.x = 0;
                guiElement.applyElementPosition(6, calcVec);

                calcVec.x = -factor;
                guiElement.applyElementPosition(1, calcVec);

                calcVec.y = 0;
                guiElement.applyElementPosition(4, calcVec);

                calcVec.y = -factor;
                guiElement.applyElementPosition(2, calcVec);

                calcVec.x = 0;
                guiElement.applyElementPosition(7, calcVec);

                calcVec.x = factor;
                guiElement.applyElementPosition(3, calcVec);

                calcVec.y = 0;
                guiElement.applyElementPosition(5, calcVec);

            } else if (guiElement.enabled) {
                guiElement.disableGuiElement();
            }

        };

        GuiRendererCallbacks.prototype.show_cursor_point = function(guiElement) {

            if (mouseState.action[0]) {

                if (!guiElement.enabled) {
                    guiElement.enableGuiElement();
                }

                guiElement.position.set(
                    ((mouseState.x-GameScreen.getLeft()) / GameScreen.getWidth() - 0.5),
                    -((mouseState.y-GameScreen.getTop()) / GameScreen.getHeight()) + 0.5,
                    -1
                );

                this.fitView(guiElement.position);
                guiElement.applyElementPosition(0);

            } else if (guiElement.enabled) {
                guiElement.disableGuiElement();
            }

        };

        GuiRendererCallbacks.prototype.show_active_selection = function(guiElement) {

            var activeSelection = GameAPI.getSelectionActivatedActor();

            if (activeSelection) {

                if (!guiElement.enabled) {
                    guiElement.enableGuiElement();
                }

                guiElement.position.copy(activeSelection.piece.frustumCoords);
                this.fitView(guiElement.position);

                guiElement.applyElementPosition(0);

            } else if (guiElement.enabled) {
                guiElement.disableGuiElement();
            }

        };


        GuiRendererCallbacks.prototype.updateMouseState = function(mState) {
            mouseState = mState;
        };


        return GuiRendererCallbacks;

    });
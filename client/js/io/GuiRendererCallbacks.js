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
        var pointerFrustumPos = new THREE.Vector3();
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

        GuiRendererCallbacks.prototype.enable_fx_element = function(cursorElementId, pointerFrustumPos, cursorEeffectId) {
            return this.guiFeedbackFunctions.enableElement(cursorElementId, pointerFrustumPos, cursorEeffectId);
        };

        GuiRendererCallbacks.prototype.disable_fx_element = function(cursorElementId) {
            this.guiFeedbackFunctions.disableElement(cursorElementId);
        };

        GuiRendererCallbacks.prototype.setElementPosition = function(cursorElementId, pointerPos) {
            this.guiFeedbackFunctions.updateElementPosition(cursorElementId, pointerPos);
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
                guiElement.applyElementPosition();

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

                activeSelection.piece.rootObj3D.updateMatrixWorld(true);
                activeSelection.piece.getScreenPosition(activeSelection.piece.frustumCoords);
                guiElement.position.copy(activeSelection.piece.frustumCoords);
                this.fitView(guiElement.position);
                //guiElement.position.multiplyScalar(102);
                guiElement.applyElementPosition();

            } else if (guiElement.enabled) {
                guiElement.disableGuiElement();
            }

        };


        GuiRendererCallbacks.prototype.updateMouseState = function(mState) {
            mouseState = mState;
        };


        return GuiRendererCallbacks;

    });
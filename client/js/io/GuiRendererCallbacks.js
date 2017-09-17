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
        var guiRenderer;
        var mouseState;
        var calcVec = new THREE.Vector3();
        var cursorElementId = 'gui_cursor_pointer_follow';
        var cursorEeffectId = 'gui_pointer_follow_effect';


        var GuiRendererCallbacks = function(gRenderer, gameApi) {
            GameAPI = gameApi;
            guiRenderer = gRenderer;
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

        GuiRendererCallbacks.prototype.generateChildElement = function(dataKey, callback) {
            guiRenderer.getGuiElement(dataKey, callback)
        };

        GuiRendererCallbacks.prototype.removeChildElement = function(guiElement) {
            guiRenderer.removeGuiElement(guiElement)
        };

        GuiRendererCallbacks.prototype.enable_geometry_element = function(guiElement, fxIndexe) {
            return this.guiFeedbackFunctions.enableElement(guiElement.elementId, guiElement.position, guiElement.fxIds[fxIndex], guiElement.fxElements);
        };

        GuiRendererCallbacks.prototype.enable_fx_element = function(guiElement, fxIndex) {
            return this.guiFeedbackFunctions.enableElement(guiElement.elementId, guiElement.position, guiElement.fxIds[fxIndex], guiElement.fxElements);
        };

        GuiRendererCallbacks.prototype.set_geomety_pos_quat = function(guiElement, fxElement) {
            this.guiFeedbackFunctions.updateElementPosition(fxElement, guiElement.position);
        };

        GuiRendererCallbacks.prototype.set_element_position = function(guiElement, fxElement) {
            this.guiFeedbackFunctions.updateElementPosition(fxElement, guiElement.position);
        };

        GuiRendererCallbacks.prototype.disable_fx_element = function(fxStore) {
            this.guiFeedbackFunctions.disableElement(fxStore);
        };

        GuiRendererCallbacks.prototype.show_aim_state_status = function(guiElement) {

            var activeSelection = GameAPI.getSelectionActivatedActor();

            if (activeSelection) {

                var controllerActor = GameAPI.getControlledActor();

                if (!controllerActor) {
                    return;
                }

                var state = controllerActor.piece.getPieceStateByStateId(guiElement.options.sample_state);

                var value = state.getValue();

                var axisFactors = guiElement.options.axis_factors;

                if (!guiElement.enabled) {
                    guiElement.enableGuiElement();
                }

                guiElement.origin.copy(activeSelection.piece.frustumCoords);
                this.fitView(guiElement.origin);

                var max_offset = 20;

                var distance = activeSelection.piece.cameraDistance;
                var offset = max_offset * Math.sqrt(Math.abs(value * 0.6)) * Math.abs(value) * 4;
                var factor = Math.clamp(offset / (distance), -0.25, 0.25);

                calcVec.z = 0;

                calcVec.x = factor * axisFactors[0];
                calcVec.y = factor * axisFactors[1];
                guiElement.applyElementPosition(0, calcVec);

                calcVec.x = -factor * axisFactors[0];
                calcVec.y = -factor * axisFactors[1];
                guiElement.applyElementPosition(1, calcVec);

            } else if (guiElement.enabled) {
                guiElement.disableGuiElement();
            }

        };

        var lasActiveSelection;

        GuiRendererCallbacks.prototype.show_combat_status = function(guiElement) {

            var activeSelection = GameAPI.getSelectionActivatedActor();

            if (activeSelection) {

                if (activeSelection !== lasActiveSelection) {
                    guiElement.disableGuiElement();
                }

                lasActiveSelection = activeSelection;

                var combatStatus = activeSelection.piece.getCombatStatus();
                if (!combatStatus) return;

                var factor =  guiElement.options.offset_y;

                var maxHealth = combatStatus.getMaxHealth();
                var health = combatStatus.getHealth();

                var maxArmor = combatStatus.getMaxArmor();
                var armor = combatStatus.getArmor();

                var healthElementId = guiElement.options.health_element_id;
                var armorElementId = guiElement.options.armor_element_id;

                if (!guiElement.enabled) {

                    guiElement.enableGuiElement();

                    for (var i = 0; i < maxHealth; i++) {
                        guiElement.spawnChildElement(healthElementId);
                    }
                    for (i = 0; i < maxArmor; i++) {
                        guiElement.spawnChildElement(armorElementId);
                    }

                }

                guiElement.origin.copy(activeSelection.piece.frustumCoords);
                this.fitView(guiElement.origin);

                var rows = 0;

                var rowHeight = 0;

                var width = 0;

                if (guiElement.children[healthElementId]) {
                    var spaceNeeded = 0;
                    if (guiElement.children[healthElementId].length) {
                        width = guiElement.children[healthElementId][0].options.step_x
                        spaceNeeded += (maxHealth * width);
                        rowHeight = guiElement.children[healthElementId][0].options.step_y;
                    }
                }

                if (guiElement.children[armorElementId]) {
                    if (guiElement.children[armorElementId].length) {
                        spaceNeeded += (maxArmor * guiElement.children[armorElementId][0].options.step_x)
                    }
                }

                rows = Math.floor(spaceNeeded / (Math.abs(guiElement.options.offset_children[0])*2));

                var padding = 0;

                if (spaceNeeded < Math.abs(guiElement.options.offset_children[0])) {
                    padding = width;
                }



                calcVec.z = 0;
                calcVec.x = 0;
                calcVec.y = factor - rows*rowHeight;
                guiElement.applyElementPosition(0, calcVec);
                guiElement.applyElementPosition(1, calcVec);

                calcVec.x = guiElement.options.offset_children[0];
                calcVec.y = guiElement.options.offset_children[1];

                if (guiElement.children[healthElementId]) {
                    for (i = 0; i < guiElement.children[healthElementId].length; i++) {
                        calcVec.z = 0;
                        var child = guiElement.children[healthElementId][i];
                        child.origin.copy(guiElement.position);
                        child.applyElementPosition(0, calcVec);

                        if (i < health) {
                            child.applyElementPosition(1, calcVec);
                        } else {
                            calcVec.z = 99;
                            child.applyElementPosition(1, calcVec);
                        }

                        calcVec.x += child.options.step_x+padding;
                        if (calcVec.x > Math.abs(guiElement.options.offset_children[0])) {
                            calcVec.x = guiElement.options.offset_children[0];
                            calcVec.y += child.options.step_y;
                        }
                    }
                }

                if (guiElement.children[armorElementId]) {

                    calcVec.x += 0.003;

                    for (i = 0; i < guiElement.children[armorElementId].length; i++) {
                        calcVec.z = 0;
                        var child = guiElement.children[armorElementId][i];
                        child.origin.copy(guiElement.position);
                        child.applyElementPosition(0, calcVec);

                        if (i < armor) {
                            child.applyElementPosition(1, calcVec);
                        } else {
                            calcVec.z = 99;
                            child.applyElementPosition(1, calcVec);
                        }

                        calcVec.x += child.options.step_x;
                        if (calcVec.x > Math.abs(guiElement.options.offset_children[0])) {
                            calcVec.x = guiElement.options.offset_children[0];
                            calcVec.y += child.options.step_y;
                        }
                    }
                }

            } else if (guiElement.enabled) {
                guiElement.disableGuiElement();
            }

        };


        GuiRendererCallbacks.prototype.show_selection_corners = function(guiElement) {

            var activeSelection = GameAPI.getSelectedActor();

            if (activeSelection) {

                if (!guiElement.enabled) {
                    guiElement.enableGuiElement();
                }

                guiElement.origin.copy(activeSelection.piece.frustumCoords);
                this.fitView(guiElement.origin);

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

                guiElement.origin.set(
                    ((mouseState.x-GameScreen.getLeft()) / GameScreen.getWidth() - 0.5),
                    -((mouseState.y-GameScreen.getTop()) / GameScreen.getHeight()) + 0.5,
                    -1
                );

                this.fitView(guiElement.origin);

                for (var i = 0; i < guiElement.fxElements.length; i++) {
                    guiElement.applyElementPosition(i);
                }



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

                guiElement.origin.copy(activeSelection.piece.frustumCoords);
                this.fitView(guiElement.origin);

                for (var i = 0; i < guiElement.fxElements.length; i++) {
                    guiElement.applyElementPosition(i);
                }

            } else if (guiElement.enabled) {
                guiElement.disableGuiElement();
            }

        };


        GuiRendererCallbacks.prototype.updateMouseState = function(mState) {
            mouseState = mState;
        };


        return GuiRendererCallbacks;

    });
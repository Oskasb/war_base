"use strict";

define([
        'ui/GameScreen'
    ],
    function(
        GameScreen
    ) {

        var GameAPI;
        var guiRenderer;
        var mouseState;
        var calcVec = new THREE.Vector3();
        var calcVec2 = new THREE.Vector3();

        var HudUiProcessor = function(gRenderer, gameApi) {
            GameAPI = gameApi;
            guiRenderer = gRenderer;
        };


        HudUiProcessor.prototype.show_aim_state_status = function(guiElement) {

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
                GameScreen.fitView(guiElement.origin);

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



        HudUiProcessor.prototype.show_selection_corners = function(guiElement) {

            var activeSelection = GameAPI.getSelectedActor();

            if (activeSelection) {

                if (!activeSelection.piece.render) {
                    guiElement.setTarget(null);
                    guiElement.disableGuiElement();
                    return;
                }


                if (!guiElement.enabled) {
                    guiElement.enableGuiElement();
                }



                guiElement.origin.copy(activeSelection.piece.frustumCoords);
                GameScreen.fitView(guiElement.origin);

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


        HudUiProcessor.prototype.show_cursor_point = function(guiElement) {

            if (mouseState.action[0]) {

                if (!guiElement.enabled) {
                    guiElement.enableGuiElement();
                }

                guiElement.origin.set(
                    ((mouseState.x-GameScreen.getLeft()) / GameScreen.getWidth() - 0.5),
                    -((mouseState.y-GameScreen.getTop()) / GameScreen.getHeight()) + 0.5,
                    -1
                );

                GameScreen.fitView(guiElement.origin);

                for (var i = 0; i < guiElement.fxElements.length; i++) {
                    guiElement.applyElementPosition(i);
                }



            } else if (guiElement.enabled) {
                guiElement.disableGuiElement();
            }

        };

        HudUiProcessor.prototype.show_active_selection = function(guiElement) {

            var activeSelection = GameAPI.getSelectionActivatedActor();

            if (activeSelection) {

                if (!activeSelection.piece.render) {
                    guiElement.setTarget(null);
                    guiElement.disableGuiElement();
                    return;
                }

                if (!guiElement.enabled) {
                    guiElement.enableGuiElement();
                }

                guiElement.origin.copy(activeSelection.piece.frustumCoords);
                GameScreen.fitView(guiElement.origin);

                for (var i = 0; i < guiElement.fxElements.length; i++) {
                    guiElement.applyElementPosition(i);
                }

            } else if (guiElement.enabled) {
                guiElement.disableGuiElement();
            }

        };

        HudUiProcessor.prototype.updateTextElement = function(text, guiElement, position, offset) {
            guiElement.setText(text);

            for (var i = 0; i < guiElement.fxElements.length; i++) {
                guiElement.applyElementPosition(i, position);
            }

            guiElement.renderText(offset);
        };

        HudUiProcessor.prototype.show_application_status = function(guiElement) {

            var offsetChildren = guiElement.options.offset_children;

            var i;

            var entries = [
                {key:'test1', value:''+Math.floor(Math.random()*100)},
                {key:'test2', value:''+Math.floor(Math.random()*100)}
            ];

            var labelElemId = guiElement.options.label_elemet_id;
            var valueElemId = guiElement.options.value_elemet_id;

            if (!guiElement.enabled) {

                guiElement.enableGuiElement();
                for (i = 0; i < entries.length; i++) {

                    guiElement.spawnChildElement(labelElemId);
                    guiElement.spawnChildElement(valueElemId);
                }
            }

            guiElement.origin.set(guiElement.options.screen_pos[0], guiElement.options.screen_pos[1], guiElement.options.screen_pos[2]);
            GameScreen.fitView(guiElement.origin);
            guiElement.applyElementPosition(0);

            if (! guiElement.children[labelElemId]) {
                return;
            }


            calcVec.z = 0;
            calcVec.x = 0;
            calcVec.y = 0;

            calcVec2.x = 0;
            calcVec2.y = 0;
            calcVec2.z = 0;

            var child;

            for (i = 0; i < guiElement.children[labelElemId].length; i++) {

                child = guiElement.children[labelElemId][i];

                child.origin.copy(guiElement.origin);

                calcVec.x = offsetChildren[0];

                calcVec2.x = child.options.offset_x;
                calcVec2.y = child.options.offset_y;

                this.updateTextElement(entries[i].key, child, calcVec, calcVec2);

                if (guiElement.children[valueElemId][i]) {
                    calcVec.x = offsetChildren[2];
                    child = guiElement.children[valueElemId][i];
                    child.origin.copy(guiElement.origin);

                    calcVec2.x = child.options.offset_x;
                    calcVec2.y = child.options.offset_y;

                    this.updateTextElement(entries[i].value, child, calcVec, calcVec2);
                }

                calcVec.y += offsetChildren[1];
            }

        };


        HudUiProcessor.prototype.updateMouseState = function(mState) {
            mouseState = mState;
        };

        return HudUiProcessor;

    });
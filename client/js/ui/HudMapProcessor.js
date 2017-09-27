"use strict";

define([
        'ui/GameScreen',
        'PipelineAPI'
    ],
    function(
        GameScreen,
        PipelineAPI
    ) {

        var GameAPI;
        var guiRenderer;



        var calcVec = new THREE.Vector3();
        var calcVec2 = new THREE.Vector3();

        var HudMapProcessor = function(gRenderer, gameApi) {
            GameAPI = gameApi;
            guiRenderer = gRenderer;

            this.mapCenter = new THREE.Vector3();
            this.playerPos = new THREE.Vector3();
            this.mapSize = 0;

            this.mapActorElements = [];

        };

        HudMapProcessor.prototype.show_map_corners = function(guiElement) {

            if (!guiElement.enabled) {
                guiElement.enableGuiElement();
                return;
            }

            var corner = -0.28;

            var size = 0.47;

            guiElement.origin.set(corner, corner, -1); // (activeSelection.piece.frustumCoords);
            GameScreen.fitView(guiElement.origin);

            if (this.mapCenter.equals(guiElement.origin)) {
                return;
            }

            this.mapCenter.copy(guiElement.origin);


            var axis = guiElement.origin.x;
            if (Math.abs(guiElement.origin.y) < Math.abs(guiElement.origin.x)) {
                axis = guiElement.origin.y;
            }

            var factor = Math.abs(corner) * axis + size*axis;

            this.size = Math.abs(factor*2);

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

        };


        HudMapProcessor.prototype.drawActorOnMap = function(actor, guiElement, index) {

            calcVec.subVectors(actor.piece.getPos()  , this.playerPos);

            calcVec.multiplyScalar(1 / 1000);


            calcVec.y = calcVec.z - this.size;
            calcVec.x = calcVec.x - this.size;

        //    calcVec.multiplyScalar(this.size);

        //    calcVec.y = calcVec.z;

            GameScreen.fitView(calcVec);

            calcVec.z = -1;

            guiElement.applyElementPosition(0, calcVec);

            guiElement.setText(''+index);

            calcVec2.set(0, 0, 0);

            guiElement.renderText(calcVec2);

        };


        HudMapProcessor.prototype.draw_local_map = function(guiElement) {


            var controlledActor = GameAPI.getControlledActor();
            if (controlledActor) {
                this.playerPos.copy(controlledActor.piece.getPos());
            } else {
                return;
            }

            var actors = GameAPI.getActors();

            guiElement.origin.copy(this.mapCenter);

            guiElement.origin.x -= this.size/2;
            guiElement.origin.y -= this.size/2;

            if ( guiElement.children[guiElement.options.map_actor_element_id]) {

            } else {
                for (var i = 0; i < actors.length; i++) {
                    guiElement.spawnChildElement(guiElement.options.map_actor_element_id)
                }
                return;
            }


            for (var i = 0; i < actors.length; i++) {

                if (guiElement.children[guiElement.options.map_actor_element_id][i]) {
                    this.drawActorOnMap(actors[i], guiElement.children[guiElement.options.map_actor_element_id][i], i)
                } else {
                    guiElement.spawnChildElement(guiElement.options.map_actor_element_id)
                }
            }

            for (var i = i; i < guiElement.children[guiElement.options.map_actor_element_id].length; i++) {
                guiElement.despawnChildElement(guiElement.children[guiElement.options.map_actor_element_id].pop())
                i--
            }

        };


        return HudMapProcessor;

    });

"use strict";


define([
        'PipelineObject'
    ],
    function(
        PipelineObject
    ) {

    var tempVec = new THREE.Vector3();
    var tempVec2 = new THREE.Vector3();
    var tempObj3D = new THREE.Object3D();
    var outOfRange;

        var WeaponModule = function(dataKey, ready) {
            this.dataKey = dataKey;

            this.selectedTarget = null;
            this.targetFocusTime = 0;

            var applyChannelData = function() {
                this.applyData(this.pipeObj.buildConfig()[this.dataKey]);
                ready(this);
            }.bind(this);

            this.pipeObj = new PipelineObject('WEAPON_DATA', 'WEAPONS', applyChannelData, this.dataKey);
        };

        WeaponModule.prototype.applyData = function (config) {
            this.config = config;
            this.stateMap = config.state_map;
        };

        WeaponModule.prototype.setSelectedTarget = function (config) {
            this.targetFocusTime = 0;
        };


        WeaponModule.prototype.selectNearbyHostileActor = function(simulationState, module, tpf) {

            this.targetFocusTime += tpf;

            module.getObjec3D().updateMatrixWorld();

        //    module.getObjec3D().getWorldPosition(tempObj3D.position);

            tempObj3D.position.setFromMatrixPosition( module.getObjec3D().matrixWorld );

            outOfRange = this.config.range || 30;

            var nearestDistance = outOfRange;
            var distance = nearestDistance;

            var actors = simulationState.getActors();

            var selectedTarget = null;

            for (var i = 0; i < actors.length; i++) {
                if (actors[i].config.alignment === 'hostile') {
                    distance = Math.sqrt(actors[i].piece.getPos().distanceToSquared(tempObj3D.position));
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        selectedTarget = actors[i];
                    }
                }
            }

            if (this.selectedTarget !== selectedTarget) {
                this.setSelectedTarget(selectedTarget);
            }

            return selectedTarget;
        };

        WeaponModule.prototype.aimAtTargetActor = function(targetActor, module) {

            tempVec2.copy(targetActor.piece.getPos());

            module.getObjec3D().parent.worldToLocal( tempVec2 );
            module.getObjec3D().lookAt( tempVec2 );
        };

        WeaponModule.prototype.sampleState = function(targetActor, module) {


            for (var i = 0; i < this.stateMap.length; i++) {
                var state = module.getPieceStateById(this.stateMap[i].stateid);
                var param = this.stateMap[i].param;
                var axis = this.stateMap[i].axis;
                var value = module.getObjec3D()[param][axis];
                state.value = value;
            }

        };

        WeaponModule.prototype.updateWeaponState = function(simulationState, module, tpf) {
            if (!this.config) return;

            var target = this.selectNearbyHostileActor(simulationState, module);
            if (target) {

                this.aimAtTargetActor(target, module);
                this.sampleState(target, module);

            }

        };

        WeaponModule.prototype.removeWeaponModule = function () {
            this.pipeObj.removePipelineObject();
        };

        return WeaponModule
    });
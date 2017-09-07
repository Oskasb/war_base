
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
    var outOfRange = 999;

        var WeaponModule = function(dataKey, ready) {
            this.dataKey = dataKey;

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



        WeaponModule.prototype.selectNearbyHostileActor = function(simulationState, module, tpf) {

            module.getObjec3D().updateMatrixWorld();

        //    module.getObjec3D().getWorldPosition(tempObj3D.position);

            tempObj3D.position.setFromMatrixPosition( module.getObjec3D().matrixWorld );

            var nearestDistance = outOfRange;
            var distance = nearestDistance;

            var actors = simulationState.getActors();

            var selectedTarget = null;

            for (var i = 0; i < actors.length; i++) {
                if (actors[i].config.alignment === 'hostile') {
                    distance = Math.sqrt(actors[i].piece.getPos().distanceToSquared(tempObj3D.position));
                    if (distance < nearestDistance) {
                        selectedTarget = actors[i];
                    }
                }
            }

            return selectedTarget;
        };

        WeaponModule.prototype.aimAtTargetActor = function(targetActor, module) {

            module.getObjec3D().getWorldQuaternion(tempObj3D.quaternion);

        //    tempVec.set(0, 0, 1);

        //    tempVec.applyQuaternion(tempObj3D.quaternion);

            tempVec2.subVectors(targetActor.piece.getPos() , tempObj3D.position);

        //    tempObj3D.lookAt(tempVec2);

            tempObj3D.worldToLocal( tempVec2 );
            module.getObjec3D().lookAt( tempVec2 );

            //tempVec2.set(0, 0, 1);
            //tempVec2.applyQuaternion(tempObj3D.quaternion);

        //    module.getObjec3D().rotation.x = MATH.subAngles(tempObj3D.rotation.x ,  module.getObjec3D().rotation.x );
        //    module.getObjec3D().rotation.y = MATH.subAngles(tempObj3D.rotation.y ,  module.getObjec3D().rotation.y);

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
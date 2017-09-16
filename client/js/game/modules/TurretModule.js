
"use strict";


define([
        'PipelineObject'
    ],
    function(
        PipelineObject
    ) {

    var velVec = new THREE.Vector3();
    var aimVec = new THREE.Vector3();
    var tempVec = new THREE.Vector3();
    var tempVec2 = new THREE.Vector3();
    var tempObj3D = new THREE.Object3D();
    var tempObj3D2 = new THREE.Object3D();
        var tempQuat = new THREE.Quaternion();

        var mat4 =  new THREE.Matrix4();

    var outOfRange;

        var g;

        var calcElevationForTrajectory = function(vel, distance, gravity) {
            var elevation = 0.5*Math.asin(gravity*distance / (vel*vel));
            if (isNaN(elevation)) {
                elevation = -0.2;
            }
            return elevation;
        };


        var TurretModule = function(dataKey, ready, index) {

            this.turretIndex = index;

            this.dataKey = dataKey;

            this.dynamic = {
                aimPitch:        {state:0},
                aimYaw:          {state:0},
                quatX:           {state:0},
                quatY:           {state:0},
                quatZ:           {state:0},
                quatW:           {state:0}
            };

            this.selectedTarget = null;
            this.targetFocusTime = 0;
            this.cooldownCountdown = 0;

            this.activationFrame = 0;

            var applyChannelData = function() {
                this.applyData(this.pipeObj.buildConfig()[this.dataKey]);
                ready(this);
            }.bind(this);

            this.pipeObj = new PipelineObject('WEAPON_DATA', 'WEAPONS', applyChannelData, this.dataKey);
        };

        TurretModule.prototype.applyData = function (config) {
            this.config = config;
            this.stateMap = config.state_map;
            this.feedbackMap = config.feedback_map;
            this.turretOptions = config.turret.options;
            this.turnSpeed = this.turretOptions.turn_speed;
            this.axisFactors = this.turretOptions.axis_factors;
            this.defaultQuat = this.turretOptions.default_quat;
            this.targetting = this.turretOptions.targetting;
        };


        TurretModule.prototype.releaseAim = function(module, tpf) {

            tempObj3D.quaternion.set( this.defaultQuat[0], this.defaultQuat[1], this.defaultQuat[2], this.defaultQuat[3]);

            module.getObjec3D().quaternion.slerp(tempObj3D.quaternion, this.turnSpeed / tpf);

            this.dynamic.quatX.state = module.getObjec3D().quaternion.x;
            this.dynamic.quatY.state = module.getObjec3D().quaternion.y;
            this.dynamic.quatZ.state = module.getObjec3D().quaternion.z;
            this.dynamic.quatW.state = module.getObjec3D().quaternion.w;

        };

        TurretModule.prototype.aimAtTargetActor = function(targetActor, module, tpf) {

            module.getObjec3D().updateMatrixWorld();
        //    targetActor.piece.rootObj3D.updateMatrixWorld();

            aimVec.copy(targetActor.piece.getPos());

            var elevate = 0;


            tempObj3D.quaternion.copy(module.getObjec3D().quaternion);

            module.getObjec3D().parent.worldToLocal( aimVec );
            module.getObjec3D().lookAt( aimVec );

            module.getObjec3D().quaternion.x *= this.axisFactors[0];
            module.getObjec3D().quaternion.y *= this.axisFactors[1];
            module.getObjec3D().quaternion.z *= this.axisFactors[2];

            if (module.weapons[0] && this.axisFactors[0]) {

                module.weapons[0].getMuzzlePosition(module, tempObj3D.position);
                tempObj3D.position.setFromMatrixPosition(module.getObjec3D().matrixWorld);

                var distance = Math.sqrt(tempObj3D.position.distanceToSquared(targetActor.piece.getPos()));
                var exitVelocity = module.weapons[0].weaponOptions.velocity;
                elevate = calcElevationForTrajectory(exitVelocity, distance, g);
                module.getObjec3D().rotateX(this.axisFactors[0] * elevate);
            }


            this.dynamic.aimPitch.state = MATH.subAngles(module.getObjec3D().rotation.x, tempObj3D.rotation.x);
            this.dynamic.aimYaw.state = MATH.subAngles(module.getObjec3D().rotation.y, tempObj3D.rotation.y);

            tempObj3D.quaternion.slerp(module.getObjec3D().quaternion, this.turnSpeed / tpf);

            module.getObjec3D().quaternion.copy(tempObj3D.quaternion);

            this.dynamic.quatX.state = module.getObjec3D().quaternion.x;
            this.dynamic.quatY.state = module.getObjec3D().quaternion.y;
            this.dynamic.quatZ.state = module.getObjec3D().quaternion.z;
            this.dynamic.quatW.state = module.getObjec3D().quaternion.w;


        };


        TurretModule.prototype.sampleState = function( module) {

            for (var i = 0; i < this.stateMap.length; i++) {
                var state = module.getPieceStateById(this.stateMap[i].stateid);
                var param = this.stateMap[i].param;
                var axis = this.stateMap[i].axis;
                var value = module.getObjec3D()[param][axis];
                state.value = value;
                state.dirty = true;
            }
        };

        TurretModule.prototype.clearFeedbackMap = function(module, feedback) {
            var targetStateId = feedback.stateid;
            var state =         module.getPieceStateById(targetStateId);
            state.value =       0;
        };

        TurretModule.prototype.interpretTurretState = function(param, key, property) {
            return this[param][key][property];
        };

        TurretModule.prototype.applyFeedbackMap = function(module, feedback) {
            var param =         feedback.param;
            var key =           feedback.key;
            var property =      feedback.property;
            var targetStateId = feedback.stateid;
            var factor =        feedback.factor;
            var state =         module.getPieceStateById(targetStateId);
            state.value =       this.interpretTurretState(param, key, property) * factor;
            state.dirty = true;
        };

        TurretModule.prototype.applyFeedback = function(module, feedbackMap) {
            for (var i = 0; i < feedbackMap.length; i++) {
                this.applyFeedbackMap(module, feedbackMap[i]);
            }
        };



        var simState;



        TurretModule.prototype.callTarget = function(callKey, simulationState, module) {
            simState = simulationState;

            var selectNearbyHostileActor = function(module) {
                module.getObjec3D().getWorldPosition(tempObj3D.position);
                return simState.selectNearbyHostileActor(tempObj3D.position)
            };

            var getSelectionActivatedActor = function( module) {
                return simState.getSelectionActivatedActor(tempObj3D.position)
            };

            var calls = {
                activated_selection:getSelectionActivatedActor,
                nearest_hostile:selectNearbyHostileActor
            };

            return calls[callKey](module)
        };

        TurretModule.prototype.processTargetting = function(simulationState, module) {

             return this.callTarget(this.targetting, simulationState, module);

        };




        TurretModule.prototype.updateTurretState = function(simulationState, module, tpf) {
            if (!this.config) return;

            var target = this.processTargetting(simulationState, module);

            g = simulationState.getGravityConstant();

            if (target) {

                this.aimAtTargetActor(target, module, tpf);

            } else {
                this.dynamic.aimYaw.state = 1;
                this.releaseAim( module, tpf);

            //    module.getObjec3D().rotateY( module.getObjec3D().rotation.y * (1-tpf));
            }

            this.sampleState( module);

            this.applyFeedback(module, this.feedbackMap);

            return target;
        };

        TurretModule.prototype.removeTurretModule = function () {
            this.pipeObj.removePipelineObject();
        };

        return TurretModule
    });
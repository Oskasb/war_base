
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


        var TurretModule = function(dataKey, ready, index) {

            this.turretIndex = index;

            this.dataKey = dataKey;

            this.dynamic = {
                aimPitch:        {state:0},
                aimYaw:          {state:0},
                quatX:           {state:0},
                quatY:           {state:0},
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
        };



        TurretModule.prototype.releaseAim = function(module, tpf) {

            tempObj3D.quaternion.set( this.defaultQuat[0], this.defaultQuat[1], this.defaultQuat[2], this.defaultQuat[3]);

            module.getObjec3D().quaternion.slerp(tempObj3D.quaternion, this.turnSpeed / tpf);

        };

        TurretModule.prototype.aimAtTargetActor = function(targetActor, module, tpf) {

        //    module.getObjec3D().updateMatrixWorld();
        //    targetActor.piece.rootObj3D.updateMatrixWorld();

            aimVec.copy(targetActor.piece.getPos());

            tempObj3D.quaternion.copy(module.getObjec3D().quaternion);

            module.getObjec3D().parent.worldToLocal( aimVec );
            module.getObjec3D().lookAt( aimVec );

            module.getObjec3D().quaternion.x *= this.axisFactors[0];
            module.getObjec3D().quaternion.y *= this.axisFactors[1];
            module.getObjec3D().quaternion.z *= this.axisFactors[2];

            tempObj3D.quaternion.slerp(module.getObjec3D().quaternion, this.turnSpeed / tpf);
            module.getObjec3D().quaternion.copy(tempObj3D.quaternion);

            this.dynamic.aimPitch = MATH.subAngles(module.getObjec3D().rotation.x, tempObj3D.rotation.x);
            this.dynamic.aimYaw = MATH.subAngles(module.getObjec3D().rotation.y, tempObj3D.rotation.y);


        };


        TurretModule.prototype.sampleState = function( module) {

            for (var i = 0; i < this.stateMap.length; i++) {
                var state = module.getPieceStateById(this.stateMap[i].stateid);
                var param = this.stateMap[i].param;
                var axis = this.stateMap[i].axis;
                var value = module.getObjec3D()[param][axis];
                state.value = value;
                state.setBufferValue(value);

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
        };

        TurretModule.prototype.applyFeedback = function(module, feedbackMap) {
            for (var i = 0; i < feedbackMap.length; i++) {
                this.applyFeedbackMap(module, feedbackMap[i]);
            }
        };


        TurretModule.prototype.updateTurretState = function(simulationState, module, tpf) {
            if (!this.config) return;

            var target = simulationState.getSelectionActivatedActor();

            if (target) {

                this.aimAtTargetActor(target, module, tpf);

            } else {
                this.dynamic.aimYaw = 1;
                this.releaseAim( module, tpf);

            //    module.getObjec3D().rotateY( module.getObjec3D().rotation.y * (1-tpf));


            }

            this.sampleState( module);

            this.applyFeedback(module, this.feedbackMap);

        };

        TurretModule.prototype.removeTurretModule = function () {
            this.pipeObj.removePipelineObject();
        };

        return TurretModule
    });
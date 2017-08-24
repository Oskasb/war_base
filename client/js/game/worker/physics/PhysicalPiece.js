
"use strict";


define([
        'PipelineObject'
    ],
    function(
        PipelineObject
    ) {

        var threeObj = new THREE.Object3D();

        var PhysicalPiece = function(hostId, dataKey, ready) {

            this.id = hostId+'_physical';
            this.dataKey = dataKey;

            var applyData = function() {
                this.applyData(this.pipeObj.buildConfig()[dataKey], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('PHYSICS_DATA', 'PHYSICAL', applyData);
        };

        PhysicalPiece.prototype.applyData = function (config, ready) {
            this.config = config;
            this.stateMap = config.state_map;
            this.controlMap = config.control_map;
            this.feedbackMap = config.feedback_map;

            this.controls = {};

            ready();
        };

        PhysicalPiece.prototype.sampleBody = function(body) {

            threeObj.quaternion.x = body.quaternion.y;
            threeObj.quaternion.y = -body.quaternion.z;
            threeObj.quaternion.z = body.quaternion.x;
            threeObj.quaternion.w = body.quaternion.w;

            threeObj.rotateY(Math.PI*0.5)

            threeObj.position.set(body.position.x, body.position.z, body.position.y);

        };

        PhysicalPiece.prototype.applyBody = function(piece) {

            for (var i = 0; i < this.stateMap.length; i++) {
                var state = piece.getPieceStateByStateId(this.stateMap[i].stateid);
                var param = this.stateMap[i].param;
                var axis = this.stateMap[i].axis;
                var value = threeObj[param][axis];
                state.value = value;
            }

        };
        PhysicalPiece.prototype.applyControlState = function(target, piece) {

                for (var i = 0; i < this.controlMap.length; i++) {
                    var state = piece.getPieceStateByStateId(this.controlMap[i].stateid).getValue();
                    this.controls[this.controlMap[i].control] = state * this.controlMap[i].factor;
                }

                var yaw_state = this.controls.yaw_state + this.controls.steer_reverse;
                var throttle_state = this.controls.forward_state + this.controls.reverse_state ;
                var brake_state = this.controls.brake_state;
                var forward = 1;

            for (i = 0; i < target.wheelInfos.length; i++) {
                var info = target.wheelInfos[i];
                var yawFactor = info.transmissionYawMatrix * yaw_state;
                target.applyEngineForce(throttle_state * info.transmissionFactor + throttle_state * yawFactor , i);
                target.setBrake(brake_state * info.brakeFactor, i);
                target.setSteeringValue(yaw_state*forward * info.steerFactor, i);
            }



        };

        PhysicalPiece.prototype.sampleVehicle = function(target, piece) {

            for (var i = 0; i < this.feedbackMap.length; i++) {
                var param = this.feedbackMap[i].param;
                var key = this.feedbackMap[i].key;
                var property = this.feedbackMap[i].property;
                var targetStateId = this.feedbackMap[i].stateid;
                var factor = this.feedbackMap[i].factor;
                var state = piece.getPieceStateByStateId(targetStateId);
                state.value = target[param][key][property]*factor;
            }

        };

        PhysicalPiece.prototype.sampleState = function (body, piece) {

            if (this.controlMap) {
                this.applyControlState(body[this.config.shape], piece);
            }

            this.sampleBody(body);
            this.applyBody(piece);
            if (this.feedbackMap) {
                this.sampleVehicle(body[this.config.shape], piece);
            }



        };

        return PhysicalPiece
    });
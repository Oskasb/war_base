
"use strict";


define([
        'PipelineObject'
    ],
    function(
        PipelineObject
    ) {

        var threeObj = new THREE.Object3D();
        var DISABLE_DEACTIVATION = 4;
        var TRANSFORM_AUX;

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

            if (this.config.shape === 'vehicle') {
            //    this.processor = new VehicleProcessor();
            }

            ready();
        };

        PhysicalPiece.prototype.sampleVehicleChassis = function(vehicle) {

            var tm, p, q, i;

            tm = vehicle.getChassisWorldTransform();
            p = tm.getOrigin();
            q = tm.getRotation();

            threeObj.position.set(p.x(), p.y(), p.z());
            threeObj.quaternion.set(q.x(), q.y(), q.z(), q.w());

            return;
            var n = vehicle.getNumWheels();
            for (i = 0; i < n; i++) {
                vehicle.updateWheelTransform(i, true);
                tm = vehicle.getWheelTransformWS(i);
                p = tm.getOrigin();
                q = tm.getRotation();
                wheelMeshes[i].position.set(p.x(), p.y(), p.z());
                wheelMeshes[i].quaternion.set(q.x(), q.y(), q.z(), q.w());
            }

        };

        PhysicalPiece.prototype.sampleBody = function(body) {

            if (!TRANSFORM_AUX) {
                TRANSFORM_AUX = new Ammo.btTransform();
            }

            if (body.getMotionState) {
                var ms = body.getMotionState();
                if (ms) {
                    ms.getWorldTransform(TRANSFORM_AUX);
                    var p = TRANSFORM_AUX.getOrigin();
                    var q = TRANSFORM_AUX.getRotation();
                    if (isNaN(p.x())) {

                        if (Math.random() < 0.002) {
                            console.log("Bad body transform", body)


                        }
                        return;
                    }
                    threeObj.position.set(p.x(), p.y(), p.z());
                    threeObj.quaternion.set(q.x(), q.y(), q.z(), q.w());
                }

                return;
            }


            threeObj.quaternion.x = -body.quaternion.x;
            threeObj.quaternion.y = -body.quaternion.z+body.quaternion.w;
            threeObj.quaternion.z = -body.quaternion.y;
            threeObj.quaternion.w = body.quaternion.w+body.quaternion.z;
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

            piece.rootObj3D.position.copy(threeObj.position);
            piece.rootObj3D.quaternion.copy(threeObj.quaternion);
        };


        PhysicalPiece.prototype.sampleState = function (body, piece) {

            if (typeof(body.getChassisWorldTransform) === 'function') {
                this.sampleVehicleChassis(body);
            } else {
                this.sampleBody(body);
            }

            this.applyBody(piece);

            if (piece.processor) {
                piece.processor.sampleState(body, piece, this.config);
            }

        };

        return PhysicalPiece
    });
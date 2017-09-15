
"use strict";


define([
        'PipelineObject',
        'game/modules/ModuleCallbacks',
        'PipelineAPI'
    ],
    function(
        PipelineObject,
        ModuleCallbacks,
        PipelineAPI
    ) {

        var cameraFunctions;

        var frameVel = new THREE.Vector3();
        var lastTargetPos = new THREE.Vector3();
        var targetPos = new THREE.Vector3();
        var activeTargetPos = new THREE.Vector3();
        var calcQuat = new THREE.Quaternion();
        var cameraHandle = new THREE.Object3D();
        var calcVec = new THREE.Vector3();


        var CameraControl = function(dataKey, ready) {

            this.dataKey = dataKey;

            var applyData = function() {
                this.applyData(this.pipeObj.buildConfig()[dataKey]);
                ready(this);
            }.bind(this);

            this.pipeObj = new PipelineObject('CAMERA_DATA', 'CONTROLS', applyData, dataKey);

            var camFuncs = function(src, data) {
                cameraFunctions = data;
            };

            new PipelineAPI.subscribeToCategoryKey('CAMERA_DATA', 'CAMERA', camFuncs);
        //    new PipelineAPI.subscribeToCategoryKey('CAMERA_DATA', 'CONTROLS', applyData);

        };

        CameraControl.prototype.applyData = function(config) {
            this.config = config;
        };

        CameraControl.prototype.setActivatedSelection = function(piece) {
            this.activatedSelection = piece;
        };

        CameraControl.prototype.getActivatedSelection = function() {
            return this.activatedSelection;
        };

        var diff = 0;

        var lookAheadRange = 0;

        CameraControl.prototype.sampleTargetState = function(activeControlSystem, controlledActor, tpf) {

            var controlPiece = activeControlSystem.piece;

            var targetObj3d = controlPiece.rootObj3D;
            var masterValue = 0;

            var rotY = 0;

            if (!targetObj3d) return;

            if (this.config.master_state) {
                var state = controlPiece.getPieceStateByStateId(this.config.master_state.state_id);
                if (!state) return;
            //    masterValue = state.getValue();
            };


            if (this.config.view_heading) {
                var slot = controlPiece.getSlotById(this.config.view_heading.slot_id);
                if (slot) {
                    var steeringObj = slot.getVisualObj3d();


                    calcQuat.setFromRotationMatrix(targetObj3d.matrixWorld);
                    //  steeringObj.getWorldQuaternion(calcQuat);

                    calcVec.set(0, 0, Math.PI*2);
                    calcVec.applyQuaternion(calcQuat);

                    rotY = Math.atan2(calcVec.x, calcVec.z) // + Math.PI;
                }
            };
        //    masterValue = 1;

        //    rotY = Math.sin(new Date().getTime()* 0.001) * Math.PI;

            //   targetPos.setFromMatrixPosition(targetObj3d.matrixWorld);
            targetObj3d.getWorldPosition(targetPos);

            var config = this.config;
            var cameraFunc = this.config.cameraFunction;

            if (this.activatedSelection) {
                if (this.config.aimCameraFunction) {
                    cameraFunc = this.config.aimCameraFunction;

                    if (this.config.aim_config) {
                        config = this.config.aim_config;
                    }
                }
            }


            if (config.look_ahead) {

                calcQuat.setFromRotationMatrix(targetObj3d.matrixWorld);
                //  steeringObj.getWorldQuaternion(calcQuat);

                calcVec.set(0, 0, -config.look_ahead);
                calcVec.applyQuaternion(calcQuat);

                targetPos.addVectors(targetPos, calcVec);

            }


            cameraHandle.position.copy(targetPos);

            frameVel.subVectors(targetPos, activeTargetPos);

        //    if (isNaN(targetPos.y)) targetPos.copy(controls.rootObj3D.position);


            if (this.activatedSelection) {
                var piece = this.activatedSelection;

                piece.rootObj3D.getWorldPosition(calcVec);

                activeTargetPos.lerpVectors(calcVec  ,  activeTargetPos  , 1 - tpf*2.5);

                calcVec.subVectors(activeTargetPos, cameraHandle.position);


                rotY = -Math.atan2(calcVec.z, calcVec.x) - Math.PI*0.5;

                var distance = calcVec.length();

                var maxDist = 2


                var distanceFactor = MATH.clamp(0.5 * maxDist / (distance*0.2), 0, 1) ;

            //    calcVec.set(0, 0, distance*0.99);

            //    calcVec.applyQuaternion(cameraHandle.quaternion);

                diff = MATH.clamp(diff+tpf*(0.1 + diff), 0, 1) * distanceFactor ;

                if (distance > maxDist*2) {
                //    diff = MATH.clamp(diff * (0.5 * maxDist / (distance*0.2)), 0, diff) ;
                }


                calcVec.multiplyScalar(diff / (distance / maxDist));

            //    calcVec.subVectors(lastTargetPos  ,  targetPos );
            //    calcVec.multiplyScalar(diff);

                lastTargetPos.lerpVectors(lastTargetPos, calcVec, tpf*0.1);
                activeTargetPos.addVectors(targetPos, calcVec);


            //    activeTargetPos.copy(targetPos);
                // targetPos.copy(calcVec);





            } else {

                diff = MATH.clamp(diff-tpf*0.4, 0, 1) ;

                //    lastTargetPos.multiplyScalar(diff);
                calcVec.subVectors(lastTargetPos  ,  targetPos );
                calcVec.multiplyScalar(diff);
                activeTargetPos.addVectors(targetPos, calcVec);



            }





       //     lastTargetPos.addVectors(targetPos , activeTargetPos , 1 - (diff / (dist/30)));

            lastTargetPos.copy(activeTargetPos);

            cameraFunctions[cameraFunc](activeTargetPos, config, masterValue, rotY, tpf);
        //    lastTargetPos.copy(targetPos);
        };

        CameraControl.prototype.updateCameraCopntrol = function(activeControlSystem, controlledActor, tpf) {
            var focusPiece = activeControlSystem.focusPiece;
            if (focusPiece) {
                activeControlSystem.setControlPieceRootTransform(focusPiece.getPos(), focusPiece.getQuat());
            }

            this.sampleTargetState(activeControlSystem, controlledActor, tpf);
        };


        CameraControl.prototype.removeCameraControls = function() {
            this.pipeObj.removePipelineObject();
        };

        return CameraControl
    });
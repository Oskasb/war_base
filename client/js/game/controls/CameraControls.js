
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

        var targetPos = new THREE.Vector3();
        var calcQuat = new THREE.Quaternion();
        var calcEuler = new THREE.Euler();
        var calcVec = new THREE.Vector3();


        var CameraControl = function(dataKey, ready) {

            this.dataKey = dataKey;

            var applyData = function() {
                this.applyData(this.pipeObj.buildConfig()[dataKey]);
                ready(this);
            }.bind(this);

            this.pipeObj = new PipelineObject('CAMERA_DATA', 'CONTROLS', applyData);

            var camFuncs = function(src, data) {
                cameraFunctions = data;
            };

            new PipelineAPI.subscribeToCategoryKey('CAMERA_DATA', 'CAMERA', camFuncs);
        //    new PipelineAPI.subscribeToCategoryKey('CAMERA_DATA', 'CONTROLS', applyData);

        };

        CameraControl.prototype.applyData = function(config) {
            this.config = config;
        };

        CameraControl.prototype.sampleTargetState = function(activeControlSystem, controlledActor, tpf) {

            var controlPiece = activeControlSystem.piece;

            var targetObj3d = controlPiece.rootObj3D;
            var masterValue = 0;

            var rotY = 0;

            if (!targetObj3d) return;

            if (this.config.master_state) {
                var state = controlPiece.getPieceStateByStateId(this.config.master_state.state_id);
                if (!state) return;
                masterValue = state.getValue();
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

        //    if (isNaN(targetPos.y)) targetPos.copy(controls.rootObj3D.position);

            cameraFunctions[this.config.cameraFunction](targetPos, this.config, masterValue, rotY, tpf)
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
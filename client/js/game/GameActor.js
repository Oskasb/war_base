
"use strict";


define([
        'Events',
        'PipelineObject',
        'game/pieces/GamePiece',
        'game/controls/ControlStateMap',
        'game/controls/CameraControls',
        'game/worker/physics/PhysicalPiece'
    ],
    function(
        evt,
        PipelineObject,
        GamePiece,
        ControlStateMap,
        CameraControls,
        PhysicalPiece
    ) {

        var GameActor = function(actorId, dataKey, ready) {

            this.id = actorId;
            this.dataKey = dataKey;
            this.piece = null;
            this.physicalPiece = null;
            this.controls = null;

            this.controlStateMap = new ControlStateMap();

            var applyData = function() {
                this.applyActorData(this.pipeObj.buildConfig()[dataKey], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('PIECE_DATA', 'ACTORS', applyData);
        };

        GameActor.prototype.setGamePiece = function (piece) {
            if (this.piece) this.piece.removeGamePiece();
            this.piece = piece;
        };

        GameActor.prototype.setPhysicalPiece = function (physicalPiece) {
            this.physicalPiece = physicalPiece;
        };

        GameActor.prototype.setPhysicsBody = function (body) {
            this.body = body;
        };

        GameActor.prototype.initiateActorControls = function (controlReady) {
            var pieceReady = function(ctrlPiece) {
                this.bindControlStateMap(this.config.state_map);
                controlReady(ctrlPiece)
            }.bind(this);

            this.setControlPiece(new GamePiece(this.id, this.config.controls, pieceReady));

            var camReaedy = function(cc) {
                this.setCameraControl(cc);
            }.bind(this);

            new CameraControls(this.config.camera, camReaedy)
        };

        GameActor.prototype.releaseActorControls = function () {
            if (this.controls) this.controls.removeGamePiece();
            this.controls = null;
        };

        GameActor.prototype.setControlPiece = function (controlPiece) {
            if (this.controls) this.controls.removeGamePiece();
            this.controls = controlPiece;

        };

        GameActor.prototype.setCameraControl = function (camControl) {
            if (this.cameraControls) this.cameraControls.removeCameraControls();
            this.cameraControls = camControl;

        };

        GameActor.prototype.addControlState = function (controlStateId, targetStateId) {
            this.controlStateMap.addControlState(this.controls.getPieceStateByStateId(controlStateId), this.piece.getPieceStateByStateId(targetStateId))
        };

        GameActor.prototype.bindControlStateMap = function (stateMap) {
            for (var i = 0; i < stateMap.length; i++) {
                this.addControlState(stateMap[i].control, stateMap[i].target);
            }
        };

        GameActor.prototype.applyActorData = function (config, ready) {
            this.config = config;

            var count = 0;
            var pieceReady = function() {
                count++;
                if (count == 2) {
                    ready(this)
                }
            }.bind(this);

            this.setGamePiece(new GamePiece(this.id, config.piece, pieceReady));
            this.setPhysicalPiece(new PhysicalPiece(this.id, config.physics, pieceReady))
        };

        GameActor.prototype.samplePhysicsState = function () {
            if (this.body) {
                this.physicalPiece.sampleState(this.body, this.piece)
            }
        };

        GameActor.prototype.updateActpr = function () {
            if (this.controls) {
                /*
                if (!this.controls.rootObj3D) {
                    console.log("No control root object", this);
                    return;
                }
             */
                this.controls.rootObj3D.position.copy(this.piece.rootObj3D.position);
                this.controls.rootObj3D.quaternion.copy(this.piece.rootObj3D.quaternion); //.y = this.piece.rootObj3D.rotation.y;
                // this.controls.rootObj3D.quaternion.normalize();
                if (this.cameraControls) {
                    this.cameraControls.sampleTargetState(this.controls, this.controls.pieceStates);
                }
            }
        };

        GameActor.prototype.removeGameActor = function () {
            this.pipeObj.removePipelineObject();
            if (this.controls) this.controls.removeGamePiece();
            this.piece.removeGamePiece();
        };

        return GameActor
    });
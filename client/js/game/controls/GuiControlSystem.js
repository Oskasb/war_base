
"use strict";


define([
        'Events',
        'PipelineObject',
        'game/pieces/GamePiece',
        'game/controls/ControlStateMap',
        'game/controls/CameraControls'
    ],
    function(
        evt,
        PipelineObject,
        GamePiece,
        ControlStateMap,
        CameraControls
    ) {

    var count = 0;

        var GuiControlSystem = function(dataKey, ready) {

            count++;

            this.id = dataKey+'_'+count;
            this.dataKey = dataKey;
            this.piece = null;
            this.targetPiece = null;

            this.controlStateMap = new ControlStateMap();

            var applyData = function() {
                this.applyData(this.pipeObj.buildConfig()[dataKey], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('CONTROL_DATA', 'CONTROLS', applyData);
        };

        GuiControlSystem.prototype.applyData = function (config, ready) {
            this.config = config;

            var camReaedy = function(cc) {
                this.setCameraControl(cc);
                ready(this)
            }.bind(this);

            var pieceReady = function() {
                new CameraControls(this.config.camera, camReaedy);
            }.bind(this);

            this.setGamePiece(new GamePiece(this.id, config.piece, pieceReady));
        };

        GuiControlSystem.prototype.setGamePiece = function (piece) {
            if (this.piece) this.piece.removeGamePiece();
            this.piece = piece;
        };

        GuiControlSystem.prototype.setCameraControl = function (camControl) {
            if (this.cameraControl) this.cameraControl.removeCameraControls();
            this.cameraControl = camControl;
        };

        GuiControlSystem.prototype.getCameraControl = function () {
            return this.cameraControl;
        };

        GuiControlSystem.prototype.setTargetPiece = function (piece) {
            this.targetPiece = piece;
        };

        GuiControlSystem.prototype.setFocusPiece = function (piece) {
            this.focusPiece = piece;
        };

        GuiControlSystem.prototype.setControlPieceRootTransform = function(position, quaternion) {
            this.piece.getPos().copy(position);
            this.piece.getQuat().copy(quaternion);
        };

        GuiControlSystem.prototype.updateGuiControl = function (tpf) {
            if (this.focusPiece) {
                this.setControlPieceRootTransform(this.focusPiece.getPos(), this.focusPiece.getQuat())
            }
        };

        GuiControlSystem.prototype.removeGuiControl = function () {
            this.pipeObj.removePipelineObject();
            if (this.controls) this.controls.removeGamePiece();
            this.piece.removeGamePiece();
        };

        return GuiControlSystem
    });
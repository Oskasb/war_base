
"use strict";


define([
        'Events',
        'PipelineObject',
        'game/GamePiece',
        'game/controls/ControlStateMap',
        'game/worker/physics/PhysicalPiece'
    ],
    function(
        evt,
        PipelineObject,
        GamePiece,
        ControlStateMap,
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

        GameActor.prototype.setControlPiece = function (controlPiece) {
            if (this.controls) this.controls.removeGamePiece();
            this.controls = controlPiece;
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
                if (count == 3) {
                    this.bindControlStateMap(config.state_map);
                    ready(this)
                }
            }.bind(this);

            this.setGamePiece(new GamePiece(this.id, config.piece, pieceReady));
            this.setControlPiece(new GamePiece(this.id, config.controls, pieceReady));
            this.setPhysicalPiece(new PhysicalPiece(this.id, config.physics, pieceReady))
        };

        GameActor.prototype.samplePhysicsState = function () {
            if (this.body) {
                this.physicalPiece.sampleState(this.body, this.piece)
            }
        };

        GameActor.prototype.updateActpr = function () {
            this.controls.rootObj3D.position.copy(this.piece.rootObj3D.position);
            this.controls.rootObj3D.rotation.y = this.piece.rootObj3D.rotation.y;
        };

        GameActor.prototype.removeGameActor = function () {
            this.pipeObj.removePipelineObject();
            this.controls.removeGamePiece();
            this.piece.removeGamePiece();
        };

        return GameActor
    });
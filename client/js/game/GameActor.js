
"use strict";


define([
        'Events',
        'PipelineObject',
        'game/pieces/GamePiece',
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

    var count = 0;

        var GameActor = function(actorId, dataKey, ready) {

            count++;
            this.entryId = count;

            this.id = actorId;
            this.dataKey = dataKey;
            this.piece = null;
            this.physicalPiece = null;

            this.isCompanionActor = false;

            this.active = true;

            this.spatial = {
                vel:new THREE.Vector3(),
                pos:new THREE.Vector3()
            };

            this.controlStateMap = new ControlStateMap();

            var applyData = function() {
                this.applyActorData(this.pipeObj.buildConfig()[dataKey], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('PIECE_DATA', 'ACTORS', applyData, dataKey);
        };

        GameActor.prototype.setIsCompanion = function (bool) {
            this.isCompanionActor = bool;
        };

        GameActor.prototype.isCompanion = function () {
            return this.isCompanionActor;
        };


        GameActor.prototype.setGamePiece = function (piece) {
            if (this.piece) this.piece.removeGamePiece();
            piece.setActor(this);
            this.piece = piece;
        };

        GameActor.prototype.setPhysicalPiece = function (physicalPiece) {
            this.physicalPiece = physicalPiece;
        };

        GameActor.prototype.setPhysicsBody = function (body) {
            this.body = body;
        };

        GameActor.prototype.getPhysicsBody = function () {
            return this.body;
        };

        var activateStateId = 'state_active';
        GameActor.prototype.setActive = function (bool) {

            var actorActiveState = this.piece.getPieceStateByStateId(activateStateId);

            if (actorActiveState) {
                var value = 0;

                if (bool) {
                    value = 1 + Math.random();
                }

                actorActiveState.setValue(value);
            }

            this.active = bool;
        };


        GameActor.prototype.isActive = function() {
            return this.active;
        };

        GameActor.prototype.addControlState = function (ctrlSys, controlStateId, targetStateId) {
            this.controlStateMap.addControlState(ctrlSys.piece.getPieceStateByStateId(controlStateId), this.piece.getPieceStateByStateId(targetStateId))
        };

        GameActor.prototype.bindControlStateMap = function (ctrlSys, stateMap) {
            for (var i = 0; i < stateMap.length; i++) {
                this.addControlState(ctrlSys, stateMap[i].control, stateMap[i].target);
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

            this.setGamePiece(new GamePiece(this.entryId, config.piece, pieceReady));
            this.setPhysicalPiece(new PhysicalPiece(this.entryId, config.physics, pieceReady))
        };

        GameActor.prototype.samplePhysicsState = function () {
            if (this.body) {
                this.physicalPiece.sampleState(this.body, this.piece)
            }
        };

        GameActor.prototype.updateActor = function () {

        };

        GameActor.prototype.forcePosition = function (posVec3) {
            if (this.body) {
                this.physicalPiece.setPhysicalPosition(this.body, this.piece, posVec3)
            }
        };


        GameActor.prototype.removeGameActor = function () {
            this.pipeObj.removePipelineObject();
            if (this.controls) this.controls.removeGamePiece();
            this.piece.removeGamePiece();
        };

        return GameActor
    });
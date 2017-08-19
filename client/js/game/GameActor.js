
"use strict";


define([
        'Events',
        'PipelineObject',
        'GameAPI',
        'game/GamePiece',
    'game/controls/ControlStateMap'
    ],
    function(
        evt,
        PipelineObject,
        GameAPI,
        GamePiece,
        ControlStateMap
    ) {

        var GameActor = function(id, ready) {

            this.id = id;

            this.piece = null;
            this.controls = null;

            this.controlStateMap = new ControlStateMap();

            var applyData = function() {
                this.applyActorData(this.pipeObj.buildConfig()[id], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('PIECE_DATA', 'ACTORS', applyData);
        };

        GameActor.prototype.setGamePiece = function (piece) {
            if (this.piece) this.piece.removeGamePiece();
            this.piece = piece;

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
                if (count == 2) {
                    this.bindControlStateMap(config.state_map);
                    ready(this)
                }
            }.bind(this);

            this.setGamePiece(new GamePiece(config.piece, pieceReady));
            this.setControlPiece(new GamePiece(config.controls, pieceReady));

        };

        GameActor.prototype.removeGameActor = function () {
            this.pipeObj.removePipelineObject();
        //    this.piece.setControlPiece(null);
        };


        return GameActor
    });
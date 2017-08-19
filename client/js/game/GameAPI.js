"use strict";

define([
        'PipelineAPI',
        'game/GameActor',
        'game/worker/GameWorker',
        'game/worker/io/ConfigPublisher'
    ],

    function(
        PipelineAPI,
        GameActor,
        GameWorker,
        ConfigPublisher
    ) {

        var gameWorker;
        var configPublisher = ConfigPublisher;

        var pieces = [];


        var GameAPI = function() {

        };

        GameAPI.setupGameWorker = function() {

            var workerReady = function() {
                configPublisher.publishConfigs(gameWorker);
            };

            gameWorker = new GameWorker(workerReady);

        };

        GameAPI.initGame = function() {

        };

        GameAPI.createTerrain = function(options, onData) {
            gameWorker.makeGameRequest('createTerrain', options, onData);
        };

        GameAPI.createActor = function(options, onData) {
            var actorResponse = function(response) {
                var res = JSON.parse(response);
                new GameActor(res.dataKey, onData);
            };
            gameWorker.makeGameRequest('createActor', options, actorResponse);
        };

        GameAPI.registerActivePiece = function(piece) {
            gameWorker.registerPieceStates(piece)
        };

        GameAPI.registerPieceControls = function(piece, pieceControls, stateMap) {
            gameWorker.bindPieceControls(piece, pieceControls, stateMap)
        };

        GameAPI.addActor = function(actor) {
            this.addPiece(actor.piece);
            this.addPiece(actor.controls);
            GameAPI.registerPieceControls(actor.piece, actor.controls, actor.controlStateMap);
        };

        GameAPI.removeActor = function(actor) {
            this.removePiece(actor.piece);
            this.removePiece(actor.controls);
        };

        GameAPI.addPiece = function(piece) {
            this.removePiece(piece);
            pieces.push(piece);
        };

        GameAPI.removePiece = function(piece) {
            if (pieces.indexOf(piece) !== -1) {
                pieces.splice(pieces.indexOf(piece), 1);
            }
        };

        GameAPI.tickGame = function(tpf, time) {
            for (var i = 0; i < pieces.length; i++) {
                pieces[i].updateGamePiece(tpf, time);
            }
        };

        return GameAPI;
    });


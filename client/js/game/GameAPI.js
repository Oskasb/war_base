"use strict";

define([
        'PipelineAPI',
        'game/GameActor',
        'game/GameLevel',
        'game/worker/GameWorker',
        'game/worker/io/ConfigPublisher'
    ],

    function(
        PipelineAPI,
        GameActor,
        GameLevel,
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

        GameAPI.createLevel = function(options, onData) {

            var onRes = function(response) {
                var res = JSON.parse(response);
                new GameLevel(res.levelId, res.dataKey, onData);
            };
            gameWorker.makeGameRequest('createLevel', options, onRes);
        //    gameWorker.makeGameRequest('createLevel', options, onData);

        };

        GameAPI.closeLevel = function(level) {
            level.removeGameLevel();
        };

        GameAPI.attachTerrainToLevel = function(actor, level, onOk) {

            var onRes = function(res) {
                onOk(res);
            };

            gameWorker.makeGameRequest('attachTerrainToLevel', {actorId:actor.id, levelId:level.id}, onRes);
        };

        GameAPI.createTerrain = function(options, onRes) {
            gameWorker.makeGameRequest('createTerrain', options, onRes);
        };

        GameAPI.createActor = function(options, onData) {
            var onRes = function(response) {
                var res = JSON.parse(response);
                new GameActor(res.actorId, res.dataKey, onData);
            };
            gameWorker.makeGameRequest('createActor', options, onRes);
        };

        GameAPI.registerActivePiece = function(piece) {
            gameWorker.registerPieceStates(piece)
        };

        GameAPI.registerPieceControls = function(piece, pieceControls, stateMap) {
            gameWorker.bindPieceControls(piece, pieceControls, stateMap)
        };

        GameAPI.detatchPieceControls = function(pieceControls, stateMap) {
            gameWorker.clearPieceControls(pieceControls, stateMap)
        };

        GameAPI.addActor = function(actor) {
            this.addPiece(actor.piece);
            this.addPiece(actor.controls);
        };

        GameAPI.controlActor = function(actor) {
            GameAPI.registerPieceControls(actor.piece, actor.controls, actor.controlStateMap);
        };

        GameAPI.dropActorControl = function(actor) {
            GameAPI.detatchPieceControls(actor.controls, actor.controlStateMap);
        };

        GameAPI.removeActor = function(actor) {
            GameAPI.dropActorControl(actor);
            GameAPI.detatchPieceControls(actor.piece, actor.controlStateMap);

            this.removePiece(actor.controls);
            this.removePiece(actor.piece);
            actor.removeGameActor();

            var onRes = function(msg) {
                console.log("Actor Despwned", msg);
            };

            gameWorker.makeGameRequest('despawnActor', actor.id, onRes);
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


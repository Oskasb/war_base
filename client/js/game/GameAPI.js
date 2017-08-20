"use strict";

define([
        'PipelineAPI',
        'ThreeAPI',
        'game/GameActor',
        'game/levels/LevelBuilder',
        'game/worker/GameWorker',
        'game/worker/io/ConfigPublisher'
    ],

    function(
        PipelineAPI,
        ThreeAPI,
        GameActor,
        LevelBuilder,
        GameWorker,
        ConfigPublisher
    ) {

        var gameWorker;
        var levelBuilder;
        var configPublisher = ConfigPublisher;

        var pieces = [];
        var actors = [];

        var GameAPI = function() {

        };

        GameAPI.setupGameWorker = function() {

            levelBuilder = new LevelBuilder(GameAPI);

            var workerReady = function() {
                configPublisher.publishConfigs(gameWorker);
            };

            gameWorker = new GameWorker(workerReady);

        };

        GameAPI.initGame = function() {

        };

        GameAPI.createLevel = function(options, onData) {

            var onRes = function(response) {
                levelBuilder.createLevel(JSON.parse(response), onData);
            };

            gameWorker.makeGameRequest('createLevel', options, onRes);
            //    gameWorker.makeGameRequest('createLevel', options, onData);
        };

        GameAPI.closeLevel = function(level) {
            GameAPI.removeActor(level.actor);
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
            var actorReady = function(actor) {
                gameWorker.bindPieceControls(actor.piece, actor.controls, actor.controlStateMap);
                onData(actor);
            };

            var onRes = function(response) {
                var res = JSON.parse(response);
                new GameActor(res.actorId, res.dataKey, actorReady);
            };
            gameWorker.makeGameRequest('createActor', options, onRes);
        };

        GameAPI.registerActivePiece = function(piece) {
            gameWorker.registerPieceStates(piece)
        };

        GameAPI.registerPieceControls = function(piece, pieceControls, stateMap) {

        };

        GameAPI.detatchPieceControls = function(pieceControls, stateMap) {
            gameWorker.clearPieceControls(pieceControls, stateMap)
        };

        GameAPI.addActor = function(actor) {
            this.addPiece(actor.piece);
            this.addPiece(actor.controls);
            actors.push(actor);
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

            if (actors.indexOf(actor) !== -1) {
                actors.splice(actors.indexOf(actor), 1);
            }

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
                pieces[i].determineVisibility();
                pieces[i].updateGamePiece(tpf, time);
            }

            for (var i = 0; i < actors.length; i++) {
                actors[i].updateActpr();
            }

        };

        return GameAPI;
    });


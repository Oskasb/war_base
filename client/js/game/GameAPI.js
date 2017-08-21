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

        var calls = {};

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

        GameAPI.getActorById = function(actorId) {
            for (var i = 0; i < actors.length; i++) {
                if (actors[i].id === actorId) {
                    return actors[i];
                }
            }
            console.log("No actor by id:", actorId, actors);
        };

        GameAPI.createLevel = function(options, onData) {

            var levelReady = function(level) {
                onData(level);
            };

            var onRes = function(response) {
                levelBuilder.createLevel(JSON.parse(response), levelReady);
            };

            gameWorker.makeGameRequest('createLevel', options, onRes);
        };

        GameAPI.closeLevel = function(level) {

            var onRemove = function(actorId) {
                console.log("Removed levelActor", actorId);
            };

            var onRes = function (levelId) {
                GameAPI.removeActor(level.actor, onRemove);
            };

            level.removeGameLevel();
            gameWorker.makeGameRequest('despawnLevel', level.id, onRes);

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

        GameAPI.controlActor = function(actor) {

            var controlReady = function(controlPiece) {
                GameAPI.registerActivePiece(controlPiece);
                gameWorker.bindPieceControls(actor.piece, controlPiece, actor.controlStateMap);
                GameAPI.addPiece(controlPiece);
            };

            actor.initiateActorControls(controlReady);

        };

        GameAPI.createActor = function(options, onData) {
            var actorReady = function(actor) {
                GameAPI.registerActivePiece(actor.piece);
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

        GameAPI.detatchPieceProtocol = function(pieceControls, stateMap) {
            gameWorker.clearPieceControls(pieceControls, stateMap)
        };

        GameAPI.addActor = function(actor) {
            this.addPiece(actor.piece);
            actors.push(actor);
        };

        GameAPI.dropActorControl = function(actor) {
            if (!actor.controls) {
                console.log("Actor Not under control..", actor);
                return;
            }
            GameAPI.detatchPieceProtocol(actor.controls, actor.controlStateMap);
            actor.releaseActorControls();
            this.removePiece(actor.controls);
        };


        GameAPI.removeActor = function(actor, removeOk) {


            var onRes = function(msg) {

                var actr = GameAPI.getActorById(msg);
                GameAPI.dropActorControl(actr);
                GameAPI.detatchPieceProtocol(actr.piece, actr.controlStateMap);

                GameAPI.removePiece(actr.piece);

                if (actors.indexOf(actr) !== -1) {
                    actors.splice(actors.indexOf(actr), 1);
                } else {
                    console.log("No actor to remove by id:", msg);
                }

                actr.removeGameActor();
                removeOk(msg);


            };

            gameWorker.makeGameRequest('despawnActor', actor.id, onRes);
        };

        GameAPI.addPiece = function(piece) {
            GameAPI.removePiece(piece);
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


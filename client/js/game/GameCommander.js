"use strict";

define([        'game/GameActor'],

    function(GameActor) {


    var GameAPI;
        var gameWorker;
        var levelBuilder;

        var GameCommander = function(gameApi, gWorker, lvlBuilder) {
            GameAPI = gameApi;
            gameWorker =  gWorker;
            levelBuilder =lvlBuilder;
        };

        GameCommander.prototype.getEntryById = function(array, id) {
            for (var i = 0; i < array.length; i++) {
                if (array[i].id === id) {
                    return array[i];
                }
            }

            console.log("No entry by id:", id, array);
        };

        GameCommander.prototype.removeArrayEntry = function(array, entry) {
            if (array.indexOf(entry) !== -1) {
                array.splice(array.indexOf(entry), 1);
                return;
            }

            console.log("No entry by in list:", array, entry);
        };

        GameCommander.prototype.initLevel = function(levels, options, onOk) {

            var levelReady = function(level) {
                levels.push(level);
                onOk(level);
            };


            var onRes = function(response) {
                levelBuilder.createLevel(JSON.parse(response), levelReady);
            };

            gameWorker.makeGameRequest('createLevel', options, onRes);
        };

        GameCommander.prototype.removeLevel = function(level) {

            var onRemove = function(actorId) {
                console.log("Removed level Actor", actorId);
            };

            var removeLevelActors = function(lvl) {
                for (var i = 0; i < lvl.actors.length; i++) {
                    var actor = lvl.actors[i];
                    GameAPI.removeActor(actor, onRemove);
                }
            };

            var onRes = function (levelId) {
                var lvl = GameAPI.getLevelById(levelId);
                levelBuilder.removeLevelTerrainActors(lvl);
                removeLevelActors(lvl)
            };

            level.removeGameLevel();
            gameWorker.makeGameRequest('despawnLevel', level.id, onRes);
        };

        GameCommander.prototype.enableActorControls = function(actor) {
            var controlReady = function(controlPiece) {
                GameAPI.registerActivePiece(controlPiece);
                gameWorker.bindPieceControls(actor.piece, controlPiece, actor.controlStateMap);
                GameAPI.addPiece(controlPiece);
            };

            actor.initiateActorControls(controlReady);
        };

        GameCommander.prototype.disableActorControls = function(actor) {
            if (!actor.controls) {
                console.log("Actor Not under control..", actor);
                return;
            }
            GameAPI.detatchPieceProtocol(actor.controls, actor.controlStateMap);
            GameAPI.removePiece(actor.controls);
            actor.releaseActorControls();
        };


        GameCommander.prototype.createGameActor = function(options, onData) {
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

        GameCommander.prototype.removeGameActor = function(actors, actor, onOk) {

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
                onOk(msg);

            };

            gameWorker.makeGameRequest('despawnActor', actor.id, onRes);
        };

        return GameCommander;
    });


"use strict";

define([
    'ThreeAPI',
    'game/GameActor',
        'game/controls/GuiControlSystem'
    ],

    function(
        ThreeAPI,
        GameActor,
        GuiControlSystem
    ) {


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
            }
        };


        GameCommander.prototype.initLevel = function(levels, options, onOk) {

            var levelPopulated = function(lvl) {
                onOk(lvl);
            };


            var levelReady = function(level) {
                levels.push(level);
                levelBuilder.populateLevel(level, levelPopulated);
            };

            var levelActorReady = function(level, actor) {

                var terrainAttachedOk = function(res) {
                    var idMap = JSON.parse(res[0]);
                    var buffers = res[1];
                    levelBuilder.createLevelTerrainActor(level, actor, buffers, levelReady);
                };

                gameWorker.makeGameRequest('attachTerrainToLevel', {actorId:actor.id, levelId:level.id}, terrainAttachedOk);
            };

            var onRes = function(response) {
                levelBuilder.createLevel(JSON.parse(response), levelActorReady);
            };

            gameWorker.makeGameRequest('createLevel', options, onRes);
        };

        GameCommander.prototype.removeLevel = function(level) {

            var onReset = function(res) {
                console.log("Reset level Simulation", res);
            };

            var onRemove = function(l) {
                console.log("Removed level Poplupation", l);
                gameWorker.makeGameRequest('resetSimulation', true, onReset);
            };

            var removeLevelActors = function(lvl) {
                levelBuilder.dePopulateLevel(lvl, onRemove);
            };

            var onRes = function (levelId) {
                var lvl = GameAPI.getLevelById(levelId);
                levelBuilder.removeLevelTerrainActors(lvl);
                removeLevelActors(lvl)
            };

            level.removeGameLevel();
            gameWorker.makeGameRequest('despawnLevel', level.id, onRes);
        };

        GameCommander.prototype.createGuiControl = function(dataKey, onRes) {

            var ctrlReady = function(ctrlSys) {
                GameAPI.addGuiControl(ctrlSys);
                GameAPI.addPiece(ctrlSys.piece);
                ThreeAPI.addToScene(ctrlSys.piece.rootObj3D);
                onRes(ctrlSys)
            }.bind(this);

            new GuiControlSystem(dataKey, ctrlReady);

        };


        GameCommander.prototype.enableActorControls = function(actor) {

            var controlReady = function(ctrlSys) {

                actor.bindControlStateMap(ctrlSys, actor.config.state_map);
                gameWorker.registerPieceStates(ctrlSys.piece);
                gameWorker.bindPieceControls(actor.piece, ctrlSys.piece, actor.controlStateMap);
                GameAPI.setActiveControlSys(ctrlSys);
                ctrlSys.setFocusPiece(actor.piece);

            };


            this.createGuiControl(actor.config.controls, controlReady);

        };

        GameCommander.prototype.disableActorControls = function(actor, activeControl) {
            if (!actor) {
                console.log("Not actor to disable");
                return;
            }
            if (!activeControl) {
                return;
            }

            gameWorker.clearPieceControls(activeControl, actor.controlStateMap);

            GameAPI.removePiece(activeControl.piece);
            GameAPI.removeGuiControl(activeControl);

            actor.releaseActorControls();
        };


        GameCommander.prototype.createGameActor = function(options, onData) {
            var actorReady = function(actor) {
                gameWorker.registerPieceStates(actor.piece);
                ThreeAPI.addToScene(actor.piece.rootObj3D);
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
                gameWorker.clearPieceControls(actr.piece, actr.controlStateMap);

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


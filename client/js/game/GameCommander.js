"use strict";

define([
    'ThreeAPI',
    'game/GameActor',
        'game/controls/GuiControlSystem',
        'game/modules/ModuleCallbacks',
        'game/controls/CameraControls'
    ],

    function(
        ThreeAPI,
        GameActor,
        GuiControlSystem,
        ModuleCallbacks,
        CameraControls
    ) {


        var GameAPI;
        var gameWorker;
        var levelBuilder;

        var GameCommander = function(gameApi, gWorker, lvlBuilder) {
            GameAPI = gameApi;
            gameWorker =  gWorker;
            levelBuilder =lvlBuilder;
            ModuleCallbacks.initCallbacks(GameAPI);


            var executorOkResponse = function(res) {
            //    console.log("executorOkResponse:", res);
            };

            var executeDeployActor = function(message) {
                this.buildGameActor(message[1].actorId, message[1].dataKey, executorOkResponse)
            }.bind(this);

            var executeRemoveActor = function(message) {
                this.clearGameActor(message[1], executorOkResponse)
            }.bind(this);

            gameWorker.setExecutor('executeDeployActor', executeDeployActor);
            gameWorker.setExecutor('executeRemoveActor', executeRemoveActor)


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

        GameCommander.prototype.removeGuiControl = function(ctrlSys) {
            GameAPI.removePiece(ctrlSys.piece);
            ThreeAPI.removeModel(ctrlSys.piece.rootObj3D);
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


        GameCommander.prototype.createCameraControlSystem = function(dataKey, onRes) {

            var camReady = function(camSys) {
                onRes(camSys)
            }.bind(this);

            new CameraControls(dataKey, camReady);
        };

        GameCommander.prototype.enableActorControls = function(actor) {


            var onRes = function() {

                var controlReady = function(ctrlSys) {

                    var camReady = function(camSys) {
                        actor.bindControlStateMap(ctrlSys, actor.config.state_map);
                        gameWorker.registerPieceStates(ctrlSys.piece);
                        gameWorker.bindPieceControls(actor.piece, ctrlSys.piece, actor.controlStateMap);
                        GameAPI.setActiveControlSys(ctrlSys);
                        GameAPI.setActiveCameraControl(camSys);
                        ctrlSys.setFocusPiece(actor.piece);
                    };

                    GameAPI.createCameraControls(ctrlSys.config.camera, camReady);
                };

                this.createGuiControl(actor.config.controls, controlReady);
            }.bind(this);

            gameWorker.makeGameRequest('setControledActor', {actorId:actor.id}, onRes);

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
        };

        GameCommander.prototype.buildGameActor = function(actorId, dataKey, onData) {
            var actorReady = function(actor) {
                GameAPI.addActor(actor);
                gameWorker.registerPieceStates(actor.piece);
                ThreeAPI.addToScene(actor.piece.rootObj3D);
                onData(actor);
            };

            new GameActor(actorId, dataKey, actorReady);
        };

        GameCommander.prototype.createGameActor = function(options, onData) {


            var onRes = function(response) {
                var res = JSON.parse(response);
                this.buildGameActor(res.actorId, res.dataKey, onData);
            }.bind(this);
            gameWorker.makeGameRequest('createActor', options, onRes);
        };


        GameCommander.prototype.clearGameActor = function(actorId, onOk) {
            var actors = GameAPI.getActors();

            var actr = GameAPI.getActorById(actorId);

            if (actr === GameAPI.getControlledActor()) {
                GameAPI.dropActorControl(actr);
            }

            gameWorker.clearPieceControls(actr.piece, actr.controlStateMap);

            GameAPI.removePiece(actr.piece);

            if (actors.indexOf(actr) !== -1) {
                actors.splice(actors.indexOf(actr), 1);
            } else {
                console.log("No actor to remove by id:", msg);
            }

            actr.removeGameActor();
            onOk(actorId)
        };

        GameCommander.prototype.removeGameActor = function(actor, onOk) {

            var onRes = function(msg) {
                this.clearGameActor(msg, onOk);
            }.bind(this);

            gameWorker.makeGameRequest('despawnActor', actor.id, onRes);
        };

        return GameCommander;
    });


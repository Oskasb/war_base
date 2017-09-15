"use strict";

define([
    'ThreeAPI',
    'game/ActorBuilder',
        'game/controls/GuiControlSystem',
        'game/modules/ModuleCallbacks',
        'game/controls/CameraControls',
        'game/combat/CombatFeedbackFunctions'
    ],

    function(
        ThreeAPI,
        ActorBuilder,
        GuiControlSystem,
        ModuleCallbacks,
        CameraControls,
        CombatFeedbackFunctions
    ) {


        var GameAPI;
        var gameWorker;
        var selectionActiveActor;
        var levelBuilder;
        var actorBuilder;
        var combatFeedbackFunctions;

        var GameCommander = function(gameApi, gWorker, lvlBuilder) {
            GameAPI = gameApi;
            gameWorker =  gWorker;
            levelBuilder =lvlBuilder;
            actorBuilder = new ActorBuilder();
            combatFeedbackFunctions = new CombatFeedbackFunctions();

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

            var executeAttackHit = function(message) {
                this.executeAttackHit(message[1], executorOkResponse)
            }.bind(this);

            gameWorker.setExecutor('executeDeployActor', executeDeployActor);
            gameWorker.setExecutor('executeRemoveActor', executeRemoveActor);
            gameWorker.setExecutor('executeAttackHit',  executeAttackHit)


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

            };


            var levelReady = function(level) {

                levels.push(level);
            //    levelBuilder.populateLevel(level, levelPopulated);
                onOk(level);
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


        GameCommander.prototype.removeRemainingActors = function() {
            var remove = function() {
                var actor = GameAPI.getActors()[0];
                if (actor) {
                    this.clearGameActor(actor.id, remove);
                }
            }.bind(this);

            if (GameAPI.getControlledActor()) {
                GameAPI.dropActorControl(GameAPI.getControlledActor());
            }

            remove()
        };


        GameCommander.prototype.removeLevel = function(level) {


            var onReset = function(res) {
                console.log("Reset level Simulation", res);
                this.removeRemainingActors();
            }.bind(this);

            var onRemove = function(l) {
                console.log("Removed level", l);
                gameWorker.makeGameRequest('resetSimulation', true, onReset);
            };

            var removeLevelActors = function(lvl) {
            //    levelBuilder.dePopulateLevel(lvl, onRemove);
            };

            var onRes = function (levelId) {
                var lvl = GameAPI.getLevelById(levelId);
                levelBuilder.removeLevelTerrainActors(lvl);
                onRemove(lvl)
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


        GameCommander.prototype.setSelectionActiveActor = function(actor) {

            var onRes = function(res) {
                console.log("Selection Confirmed", res);
            };

            if (selectionActiveActor !== actor) {
                var id = null;
                if (actor) {
                    id = actor.id;
                }
                gameWorker.makeGameRequest('setActorSelected', id, onRes);
                selectionActiveActor = actor;
            }


        };


        GameCommander.prototype.enableActorControls = function(actor) {


            var onRes = function() {

                var controlReady = function(ctrlSys) {

                    var camReady = function(camSys) {
                        actor.bindControlStateMap(ctrlSys, actor.config.state_map);
                        gameWorker.registerActorPieceStates(ctrlSys);
                        gameWorker.bindActorControls(actor, ctrlSys);
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

            gameWorker.clearActorControls(activeControl, actor.controlStateMap);

            GameAPI.removePiece(activeControl.piece);
            GameAPI.removeGuiControl(activeControl);
        };

        GameCommander.prototype.buildGameActor = function(actorId, dataKey, onData) {

            var createIt = function(dkey, id, cb) {

                var actorReady = function(actor) {
                    actor.id = id;
                    gameWorker.registerActorPieceStates(actor);
                    GameAPI.addActor(actor);
                    ThreeAPI.addToScene(actor.piece.rootObj3D);
                    cb(actor);
                };

                actorBuilder.getActor(dkey, actorReady);

            };

            createIt(dataKey, actorId, onData);

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

            gameWorker.clearActorControls(actr.piece, actr.controlStateMap);

            GameAPI.removePiece(actr.piece);

            if (actors.indexOf(actr) !== -1) {
                actors.splice(actors.indexOf(actr), 1);
            } else {
                console.log("No actor to remove by id:", actorId);
            }

            actorBuilder.removeActor(actr);
            onOk(actorId)
        };

        GameCommander.prototype.removeGameActor = function(actor, onOk) {

            var onRes = function(msg) {
                this.clearGameActor(msg, onOk);
            }.bind(this);

            gameWorker.makeGameRequest('despawnActor', actor.id, onRes);
        };

        var posVec = new THREE.Vector3();
        var normalVec = new THREE.Vector3();

        GameCommander.prototype.executeAttackHit = function(message) {
            var actor = GameAPI.getActorById(message[0]);

            posVec.x = message[1];
            posVec.y = message[2];
            posVec.z = message[3];

            normalVec.x = message[4];
            normalVec.y = message[5];
            normalVec.z = message[6];

            combatFeedbackFunctions.registerAttackHit(actor, posVec, normalVec, message[7], message[8]);

        };


        return GameCommander;
    });


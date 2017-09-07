"use strict";

define([
        'PipelineAPI',
        'worker/simulation/SimulationOperations',
        'ThreeAPI',
        'worker/physics/AmmoAPI',
        'worker/terrain/TerrainFunctions'

    ],
    function(
        PipelineAPI,
        SimulationOperations,
        ThreeAPI,
        AmmoAPI,
        TerrainFunctions
    ) {

        var actors = [];
        var levels = [];
        var time = 0;

        var physicsApi;

        var SimulationState = function(Ammo, protocolSystem) {
            this.protocolSystem = protocolSystem;
            this.controlledActorId = null;

            physicsApi = new AmmoAPI(Ammo);
            this.terrainFunctions = new TerrainFunctions(physicsApi);
            this.simulationOperations = new SimulationOperations(this.terrainFunctions);

            ThreeAPI.initThreeScene();
        };

        SimulationState.prototype.addLevel = function(options, ready) {

            physicsApi.initPhysics();

            ThreeAPI.initThreeScene();

            var levelBuilt = function(level) {
                levels.push(level);
                ready({dataKey:level.dataKey, levelId:level.id, config:level.config});
            }.bind(this);

        //
            this.simulationOperations.buildLevel(options, levelBuilt);
        //

        };

        SimulationState.prototype.includeActor = function(actor) {
            physicsApi.setupPhysicalActor(actor);

            ThreeAPI.addToScene(actor.piece.rootObj3D);

            if (actor.body) {
                physicsApi.includeBody(actor.body);
            }
            actors.push(actor);
        };

        var buildIt = function(actor, pos, normal, cb, simState) {
            var res = {dataKey:actor.dataKey, actorId:actor.id};

            actor.piece.getPos().copy(pos);
            actor.piece.rootObj3D.lookAt(normal);
            simState.includeActor(actor);
            cb(res);

            postMessage(['executeDeployActor', res]);
        };

        SimulationState.prototype.generateActor = function(actorId, pos, normal, onOk) {

            var respond = onOk;
            var _this = this;

            var actorBuilt = function(actor) {
                buildIt(actor, pos, normal, respond, _this)
            };

            this.simulationOperations.buildActor({dataKey:actorId}, actorBuilt);

        };

        SimulationState.prototype.getGridSystemIdAtPos = function(pos) {
            return "basic_grassland";
        };

        SimulationState.prototype.despawnActor = function(actorId) {

            var onOk = function(aId) {
                postMessage(['executeRemoveActor', aId]);
            };

            this.removeActor(actorId, onOk);
        };

        SimulationState.prototype.spawnActor = function(options, ready) {

            var actorBuilt = function(actor) {
                this.simulationOperations.getRandomPointOnTerrain(actor.piece.rootObj3D.position, levels);
                this.includeActor(actor);
                ready({dataKey:actor.dataKey, actorId:actor.id});
            }.bind(this);

            this.simulationOperations.buildActor(options, actorBuilt);
        };

        SimulationState.prototype.setControlledActorId = function(actorId, onOk) {
            this.controlledActorId = actorId;
            onOk(actorId);
        };

        SimulationState.prototype.getControlledActor = function() {
            return this.getActorById(this.controlledActorId)
        };

        SimulationState.prototype.getActors = function() {
            return actors;
        };

        SimulationState.prototype.getActorById = function(actorId) {
            for (var i = 0; i < actors.length; i++) {
                if (actors[i].id == actorId) {
                    return actors[i];
                }
            }
        //    console.log("No actor by id:", actorId, actors);
        };

        SimulationState.prototype.getLevelById = function(leveId) {
            for (var i = 0; i < levels.length; i++) {
                if (levels[i].id === leveId) {
                    return levels[i];
                }
            }
            console.log("No level by id:", leveId, actors);
        };

        SimulationState.prototype.removeActor = function(actorId, cb) {
            var actor = this.getActorById(actorId);

            if (actorId === this.controlledActorId) {
                this.controlledActorId = null;
            }

            actors.splice(actors.indexOf(actor), 1);

            this.protocolSystem.removeProtocol(actor);
            if (actor.body) {
                physicsApi.disableActorPhysics(actor);
            }

            actor.piece.removeGamePiece();
            actor.removeGameActor();
            ThreeAPI.removeFromScene(actor.piece.rootObj3D);

            cb(actorId);
        };



        SimulationState.prototype.removeLevel = function(levelId, cb) {

            var level = this.getLevelById(levelId);
            levels.splice(levels.indexOf(level), 1);

            cb(levelId);
        };

        SimulationState.prototype.getTerrainHeightAtPos = function(posVec3, tempVec3) {
            return this.simulationOperations.getHeightAtPos(posVec3, levels, tempVec3);
        };

        SimulationState.prototype.cleanupSimulationState = function(cb) {
            physicsApi.cleanupPhysics(cb);
        };

        SimulationState.prototype.attachTerrainActorToLevel = function(levelId, actorId, cb) {
            var level = this.getLevelById(levelId);
            var actor = this.getActorById(actorId);

            if (actor && level) {
                level.addLevelTerrainActor(actor);
            } else {
                cb({levelActorError:{actorId:actorId, levelId:levelId}});
                console.log("Fail connectinr actor to level", actorId, levelId);
            };

            var terrainOpts = this.simulationOperations.getActorTerrainOptions(actor);

            console.log("OPTS", terrainOpts);

            var terrain = this.terrainFunctions.createTerrain(terrainOpts);

            level.addTerrainToLevel(terrain);

            var buffers = this.terrainFunctions.getTerrainBuffers(terrain);

            terrain.array1d = buffers[4];
            var terrainBody = this.terrainFunctions.addTerrainToPhysics(terrainOpts, terrain.array1d, 0, 0);

            physicsApi.includeBody(terrainBody);
            actor.setPhysicsBody(terrainBody);

        //    time += 0.04;
        //    physicsApi.updatePhysicsSimulation(time);

        //    this.updateActorFrame(actor, 0.02);

            cb([JSON.stringify({actorId:actorId, levelId:levelId}), buffers]);
        };



        SimulationState.prototype.updateActorFrame = function(actor, tpf) {
            this.protocolSystem.applyProtocolToActorState(actor, tpf);
            actor.piece.updateGamePiece(tpf, time, this);
            actor.samplePhysicsState();
            this.protocolSystem.updateActorSendProtocol(actor, tpf);
        };


        SimulationState.prototype.updateState = function(tpf) {

            ThreeAPI.getScene().updateMatrixWorld();

            if (levels.length) {
                time += tpf;
                physicsApi.updatePhysicsSimulation(time);

            for (var i = 0; i < actors.length; i++) {

                actors[i].piece.rootObj3D.updateMatrixWorld();

                this.updateActorFrame(actors[i], tpf);

                var integrity = this.simulationOperations.checkActorIntegrity(actors[i], levels);

                if (!integrity) {
            //        this.simulationOperations.positionActorOnTerrain(actors[i], levels);
                }
            }
        }

            var status = physicsApi.fetchPhysicsStatus();
        };

        return SimulationState;

    });


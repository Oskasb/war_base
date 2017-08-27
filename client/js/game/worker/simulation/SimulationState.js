"use strict";

define([
        'PipelineAPI',
        'worker/simulation/SimulationOperations',
        'worker/physics/CannonAPI',
        'worker/terrain/TerrainFunctions'

    ],
    function(
        PipelineAPI,
        SimulationOperations,
        CannonAPI,
        TerrainFunctions
    ) {

        var actors = [];
        var levels = [];
        var time = 0;
        var SimulationState = function(protocolSystem) {
            this.protocolSystem = protocolSystem;
            this.cannonApi = new CannonAPI();
            this.terrainFunctions = new TerrainFunctions(this.cannonApi);
            this.simulationOperations = new SimulationOperations(this.terrainFunctions);
            this.cannonApi.initPhysics();
        };

        SimulationState.prototype.addLevel = function(options, ready) {

            var levelBuilt = function(level) {
                levels.push(level);
                ready({dataKey:level.dataKey, levelId:level.id, config:level.config});
            }.bind(this);

            this.simulationOperations.buildLevel(options, levelBuilt);

        };

        SimulationState.prototype.spawnActor = function(options, ready) {

            var actorBuilt = function(actor) {
                this.simulationOperations.getRandomPointOnTerrain(actor.piece.rootObj3D.position, levels);
                this.cannonApi.setupPhysicalActor(actor);
                if (actor.body) {
                    this.cannonApi.includeBody(actor.body);
                }
                actors.push(actor);
                ready({dataKey:actor.dataKey, actorId:actor.id});
            }.bind(this);

            this.simulationOperations.buildActor(options, actorBuilt);

        };

        SimulationState.prototype.getActorById = function(actorId) {
            for (var i = 0; i < actors.length; i++) {
                if (actors[i].id == actorId) {
                    return actors[i];
                }
            }
            console.log("No actor by id:", actorId, actors);
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

            actors.splice(actors.indexOf(actor), 1);

            this.protocolSystem.removeProtocol(actor);
            if (actor.body) {
                this.cannonApi.excludeBody(actor.body);
            }

            actor.removeGameActor();
            cb(actorId);
        };

        SimulationState.prototype.removeLevel = function(levelId, cb) {
            var level = this.getLevelById(levelId);
            levels.splice(levels.indexOf(level), 1);
            cb(levelId);
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

            this.cannonApi.includeBody(terrainBody);

            actor.setPhysicsBody(terrainBody);
            
            cb([JSON.stringify({actorId:actorId, levelId:levelId}), buffers]);
        };

        SimulationState.prototype.updateState = function(tpf) {

            if (levels.length) {
                time += tpf;
                this.cannonApi.updatePhysicsSimulation(time);
            }

            for (var i = 0; i < actors.length; i++) {
                this.protocolSystem.applyProtocolToActorState(actors[i], tpf);
                actors[i].piece.updateGamePiece(tpf, time);
                actors[i].samplePhysicsState();
                this.protocolSystem.updateActorSendProtocol(actors[i], tpf);

            }
            var status = this.cannonApi.fetchCannonStatus();
        };

        return SimulationState;

    });


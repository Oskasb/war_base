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
        var SimulationState = function(protocolSystem) {
            this.protocolSystem = protocolSystem;
            this.cannonApi = new CannonAPI();
            this.terrainFunctions = new TerrainFunctions(this.cannonApi);
            this.simulationOperations = new SimulationOperations();

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
                actors.push(actor);
                ready({dataKey:actor.dataKey, actorId:actor.id});
            }.bind(this);

            this.simulationOperations.buildActor(options, actorBuilt);

        };

        SimulationState.prototype.getActorById = function(actorId) {
            for (var i = 0; i < actors.length; i++) {
                if (actors[i].id === actorId) {
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
            actors.splice(actors.indexOf(actor, 1));
            this.protocolSystem.removeProtocol(actor);
            cb();
        };

        SimulationState.prototype.attachActorToLevel = function(levelId, actorId, cb) {
            var level = this.getLevelById(levelId);
            var actor = this.getActorById(actorId);

            if (actor && level) {
                level.setLevelActor(actor);
                cb({actorId:actorId, levelId:levelId});
            } else {
                cb({levelActorError:{actorId:actorId, levelId:levelId}});
                console.log("Fail connectinr actor to level", actorId, levelId);
            };
        };

        SimulationState.prototype.updateState = function(tpf) {
            for (var i = 0; i < actors.length; i++) {
                this.protocolSystem.updateActorProtocol(actors[i], tpf);
            }
        };

        return SimulationState;

    });


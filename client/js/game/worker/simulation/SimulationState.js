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
        var SimulationState = function() {
            this.cannonApi = new CannonAPI();
            this.terrainFunctions = new TerrainFunctions(this.cannonApi);
            this.SimulationOperations = new SimulationOperations();

        };

        SimulationState.prototype.spawnActor = function(options, ready) {

            var actorBuilt = function(actor) {
                actors.push(actor);
                ready({dataKey:actor.dataKey, actorId:actor.id});
            }.bind(this);

            this.SimulationOperations.buildActor(options, actorBuilt);

        };

        SimulationState.prototype.createTerrain = function(options) {

        };

        SimulationState.prototype.updateState = function(tpf) {
            for (var i = 0; i < actors.length; i++) {

            }
        };

        return SimulationState;

    });


"use strict";

define([
        'PipelineAPI'
    ],
    function(
        PipelineAPI
    ) {

        var SimulationRequests = function(simulationState) {
            this.simulationState = simulationState;
            this.terrainFunctions = simulationState.terrainFunctions;
        };

        SimulationRequests.prototype.createActor = function(options) {
            var opts = JSON.parse(options);

            var ready = function(actorSpawnData) {

                postMessage(['createActor', JSON.stringify(actorSpawnData)]);
            };

            this.simulationState.spawnActor(opts, ready);

        };

        SimulationRequests.prototype.createTerrain = function(options) {
            console.log("opts:", options);
            var array = this.terrainFunctions.createTerrainArray1d(JSON.parse(options));
            postMessage(['createTerrain', array]);
        };

        return SimulationRequests;

    });


"use strict";

define([
        'PipelineAPI'
    ],
    function(
        PipelineAPI
    ) {

        var SimulationRequests = function(simulationState) {
            this.terrainFunctions = simulationState.terrainFunctions;
        };

        SimulationRequests.prototype.createActor = function(options) {
            var opts = JSON.parse(options);
            console.log("actorRequested:", opts);
            postMessage(['createActor', JSON.stringify(opts)]);
        };

        SimulationRequests.prototype.createTerrain = function(options) {
            console.log("opts:", options);
            var array = this.terrainFunctions.createTerrainArray1d(JSON.parse(options));
            postMessage(['createTerrain', array]);
        };

        return SimulationRequests;

    });


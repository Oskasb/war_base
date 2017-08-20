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


        SimulationRequests.prototype.createLevel = function(options) {
            var opts = JSON.parse(options);

            var ready = function(levelData) {
                postMessage(['createLevel', JSON.stringify(levelData)]);
            };
            this.simulationState.addLevel(opts, ready);
        };


        SimulationRequests.prototype.createActor = function(options) {
            var opts = JSON.parse(options);

            var ready = function(actorSpawnData) {
                postMessage(['createActor', JSON.stringify(actorSpawnData)]);
            };
            this.simulationState.spawnActor(opts, ready);
        };

        SimulationRequests.prototype.despawnActor = function(actorId) {
            var ready = function() {
                postMessage(['despawnActor', 'despawned '+actorId]);
            };
            this.simulationState.removeActor(actorId, ready);
        };

        SimulationRequests.prototype.attachTerrainToLevel = function(data) {
            var opts = JSON.parse(data);
            var ready = function(res) {
                postMessage(['attachTerrainToLevel', res]);
            };
            this.simulationState.attachActorToLevel(opts.levelId, opts.actorId, ready);
        };

        SimulationRequests.prototype.createTerrain = function(options) {
            console.log("opts:", options);
            var array = this.terrainFunctions.createTerrainArray1d(JSON.parse(options));
            postMessage(['createTerrain', array]);
        };

        return SimulationRequests;

    });


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


        SimulationRequests.prototype.createLevel = function(idx, options) {
            var opts = JSON.parse(options);

            var ready = function(res) {
                postMessage([idx, JSON.stringify(res)]);
            };
            this.simulationState.addLevel(opts, ready);
        };

        SimulationRequests.prototype.resetSimulation = function(bool) {
            var ready = function(res) {
                postMessage([bool, res]);
            };
            this.simulationState.cleanupSimulationState(ready);
        };

        SimulationRequests.prototype.despawnLevel = function(idx, levelId) {
            var ready = function(res) {
                postMessage([idx, res]);
            };
            this.simulationState.removeLevel(levelId, ready);
        };

        SimulationRequests.prototype.createActor = function(idx, options) {
            var opts = JSON.parse(options);

            var ready = function(res) {
                postMessage([ idx, JSON.stringify(res)]);
            };
            this.simulationState.spawnActor(opts, ready);
        };

        SimulationRequests.prototype.despawnActor = function(idx, actorId) {
            var ready = function(res) {
                postMessage([idx,  res]);
            };
            this.simulationState.removeActor(actorId, ready);
        };





        SimulationRequests.prototype.attachTerrainToLevel = function(idx, data) {
            var opts = JSON.parse(data);
            var ready = function(res) {
                postMessage([idx, res]);
            };
            this.simulationState.attachTerrainActorToLevel(opts.levelId, opts.actorId, ready);
        };

        SimulationRequests.prototype.createTerrain = function(idx, options) {
            console.log("opts:", options);
            var terrain = this.terrainFunctions.createTerrain(JSON.parse(options));

            var buffers = this.terrainFunctions.getTerrainBuffers(terrain);
            terrain.array1d = buffers[4];

            postMessage([idx, buffers]);
        };



        return SimulationRequests;

    });


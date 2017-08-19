"use strict";

define([
        'PipelineAPI',
        'worker/physics/CannonAPI',
        'worker/terrain/TerrainFunctions'
    ],
    function(
        PipelineAPI,
        CannonAPI,
        TerrainFunctions
    ) {

        var GameSimulation = function() {
            this.cannonApi = new CannonAPI();
            this.terrainFunctions = new TerrainFunctions(this.cannonApi);
            this.actors = [];
        };

        GameSimulation.prototype.processRequest = function(msg) {
            if (typeof(this[msg[0]]) === 'function') {
                this[msg[0]](msg[1])
            } else {
                console.log("No function", msg[0])
            }
        };

        GameSimulation.prototype.createActor = function(options) {
            var opts = JSON.parse(options);
            console.log("actorRequested:", opts);
            postMessage(['createActor', JSON.stringify(opts)]);
        };

        GameSimulation.prototype.createTerrain = function(options) {
            console.log("opts:", options);
            var array = this.terrainFunctions.createTerrainArray1d(JSON.parse(options));
            postMessage(['createTerrain', array]);
        };

        return GameSimulation;

    });


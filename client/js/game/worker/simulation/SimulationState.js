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

        var SimulationState = function() {
            this.cannonApi = new CannonAPI();
            this.terrainFunctions = new TerrainFunctions(this.cannonApi);
            this.actors = [];
        };

        SimulationState.prototype.createActor = function(options) {

        };

        SimulationState.prototype.createTerrain = function(options) {

        };

        SimulationState.prototype.updateState = function(tpf) {
            for (var i = 0; i < this.actors.length; i++) {

            }
        };

        return SimulationState;

    });


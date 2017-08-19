"use strict";

define([
        'game/GameActor'

    ],
    function(
        GameActor
    ) {

        var actorCount = 0;

        var SimulationOperations = function() {

        };

        SimulationOperations.prototype.buildActor = function(options, ready) {
            actorCount++
            new GameActor('actor_'+actorCount, options.dataKey, ready);
        };

        SimulationOperations.prototype.createTerrain = function(options) {

        };

        SimulationOperations.prototype.updateState = function(tpf) {

        };

        return SimulationOperations;

    });


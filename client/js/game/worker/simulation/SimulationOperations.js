"use strict";

define([
        'game/GameActor',
        'game/GameLevel'

    ],
    function(
        GameActor,
        GameLevel
    ) {

        var actorCount = 0;
        var levelCount = 0;

        var SimulationOperations = function() {

        };

        SimulationOperations.prototype.buildLevel = function(options, ready) {
            levelCount++
            new GameLevel('level_'+levelCount, options.dataKey, ready);
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


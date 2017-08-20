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

        SimulationOperations.prototype.getActorTerrainOptions = function(actor) {
            for (var i = 0; i < actor.piece.pieceSlots.length; i++) {
                var mod = actor.piece.pieceSlots[i].module;
                if (mod.config.terrain) {
                    return mod.config.options;
                }
            }
            console.log("No terrain options on actor:", actor);
        };


        SimulationOperations.prototype.updateState = function(tpf) {

        };

        return SimulationOperations;

    });


"use strict";

define([
        'game/GameActor',
        'game/levels/GameLevel'

    ],
    function(
        GameActor,
        GameLevel
    ) {

        var count = 0;

        var SimulationOperations = function() {

        };

        SimulationOperations.prototype.buildLevel = function(options, ready) {
            count++
            new GameLevel('level_'+count, options.dataKey, ready);
        };

        SimulationOperations.prototype.buildActor = function(options, ready) {
            count++
            new GameActor('actor_'+count, options.dataKey, ready);
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


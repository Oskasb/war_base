
"use strict";


define([
        'game/GameActor',
        'application/ExpandingPool'
    ],
    function(
        GameActor,
        ExpandingPool
    ) {

        var expandingPools = {};

        function createActorByDataKey(dataKey, onReadyCB) {
            new GameActor(null, dataKey, onReadyCB)
        }

        var ActorBuilder = function() {

        };


        ActorBuilder.prototype.getActor = function(dataKey, callback) {

            if (!expandingPools[dataKey]) {
                expandingPools[dataKey] = new ExpandingPool(dataKey, createActorByDataKey);
            } else {
            }
            expandingPools[dataKey].getFromExpandingPool(callback);
        };

        ActorBuilder.prototype.removeActor = function(actor) {
            actor.piece.setRendereable(false);
            expandingPools[actor.dataKey].returnToExpandingPool(actor);
        };


        return ActorBuilder
    });
"use strict";

define([

    ],
    function(

    ) {

    var oppositionMap = {};

        var AggroProcessor = function() {

            oppositionMap[ENUMS.PieceAlignments.NEUTRAL] = null;
            oppositionMap[ENUMS.PieceAlignments.GOOD] = ENUMS.PieceAlignments.EVIL;
            oppositionMap[ENUMS.PieceAlignments.EVIL] = ENUMS.PieceAlignments.GOOD;

        };

        AggroProcessor.prototype.actorsAreOpponents = function(actorA, actorB) {

            return ENUMS.PieceAlignments[actorA.config.alignment] === oppositionMap[ENUMS.PieceAlignments[actorB.config.alignment]]

        };

        AggroProcessor.prototype.selectNearbyOpponent = function(piece, actors, position) {
            var outOfRange = 999;

            var originActor = piece.getActor();
            var originAlignment = originActor.config.alignment || ENUMS.PieceAlignments.NEUTRAL;

            var nearestDistance = outOfRange;
            var distance = nearestDistance;

            var selectedTarget = null;

            for (var i = 0; i < actors.length; i++) {

                if (this.actorsAreOpponents(originActor, actors[i]) && actors[i].isVisible()) {

                    distance = Math.sqrt(actors[i].piece.getPos().distanceToSquared(position));
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        selectedTarget = actors[i];
                    }
                }
            }

            return selectedTarget;
        };



        return AggroProcessor;

    });


"use strict";


define([
    'worker/simulation/CollisionDetection'

], function(
    CollisionDetection
) {


    SpatialProcessor = function(broadcast) {

        this.collisionDetection = new CollisionDetection();

        this.calcVec   = new THREE.Vector3(0, 0, 0);
        this.calcVec2  = new THREE.Vector3(0, 0, 0);
        this.calcVec3  = new THREE.Vector3(0, 0, 0);
        this.hitPoint  = new THREE.Vector3(0, 0, 0);
        this.hitNormal = new THREE.Vector3(0, 0, 0);
        this.callbacks = {
            broadcast:broadcast
        };
        this.collissions = [];
    };


    SpatialProcessor.prototype.getAngleFromPieceToTarget = function(piece, targetPiece) {

        this.calcVec.setVec(targetPiece.spatial.pos);
        this.calcVec.subVec(piece.spatial.pos);
        return MATH.vectorXZToAngleAxisY(this.calcVec);

    };

    SpatialProcessor.prototype.getDistanceFromPieceToTarget = function(piece, targetPiece) {
        return piece.spatial.pos.getDistance(targetPiece.spatial.pos);
    };

    SpatialProcessor.prototype.getDistanceSquaredFromPieceToTarget = function(piece, targetPiece) {
        return piece.spatial.pos.getDistanceSquared(targetPiece.spatial.pos);
    };

    SpatialProcessor.prototype.checkProximity = function(players, pieces) {

        for (var key in players) {
            this.playerAgainstPieces(players[key], pieces);
            this.playerAgainstPlayers(players[key], players);
        }

        for (var i = 0; i < pieces.length; i++) {
            if (pieces[i].spatial.vel.getLengthSquared()) {
                this.pieceAgainstPieces(pieces[i], pieces);
            }

        }

    };

    SpatialProcessor.prototype.pieceAgainstPieces = function(piece, pieces) {

        for (var i = 0; i < pieces.length; i++) {
            if (piece.parentPiece !== pieces[i].parentPiece) {
                this.pieceAgainstPiece(piece, pieces[i]);
            }
        }

    };

    SpatialProcessor.prototype.playerAgainstPieces = function(player, pieces) {

        for (var i = 0; i < pieces.length; i++) {

            if (pieces[i].parentPiece !== player.piece) {
                this.playerAgainstPiece(player.piece, pieces[i]);
            }

        }

    };

    SpatialProcessor.prototype.playerAgainstPiece = function(playerPiece, piece) {

        if (piece.parentPiece === playerPiece) {
            return;
        }

        var hit = this.collisionDetection.checkIntersection(playerPiece, piece, this.hitPoint, this.hitNormal);

        if (hit) {

            //    console.log("hit: ", this.hitNormal.data[0], this.hitNormal.data[1], this.hitNormal.data[2]);


            //    playerPiece.setState(GAME.ENUMS.PieceActivationStates.BURST);
            //    piece.setState(GAME.ENUMS.PieceActivationStates.EXPLODE);

            //    piece.spatial.pos.setVec(this.hitPoint);
            //    piece.spatial.vel.setXYZ(0, 0, 0);

            //    this.calcVec.setVec(this.hitNormal);

            //    this.calcVec.subVec(playerPiece.spatial.getPosVec());
            //    fastPiece.spatial.getVelVec().addVec(this.calcVec);

            //    this.calcVec.scale(-0.6);
            //    playerPiece.spatial.getVelVec().scale(0.5);
            //    playerPiece.spatial.getVelVec().addVec(this.calcVec);

            //     piece.networkDirty = true;
            //    playerPiece.networkDirty = true;

            //   this.callbacks.broadcast(piece);
            //     this.callbacks.broadcast(playerPiece);
            //     playerPiece.setState(GAME.ENUMS.PieceActivationStates.MOVING);
            piece.setState(ENUMS.PieceActivationStates.TIME_OUT);
            piece.networkDirty = true;
        }
    };

    SpatialProcessor.prototype.playerAgainstPlayers = function(playerA, players) {
        for (var key in players) {
            if (players[key] !== playerA) {
                this.pieceAgainstPiece(playerA.piece, players[key].piece);
            }
        }

        this.collissions = [];
    };



    SpatialProcessor.prototype.pieceAgainstPiece = function(pieceA, pieceB) {


        var hit = this.collisionDetection.checkIntersection(pieceA, pieceB, this.hitPoint, this.hitNormal);

        if (hit) {

            if (this.collissions.indexOf(pieceA) !== -1 && this.collissions.indexOf(pieceB) !== -1) {
                return;
            }
            this.collissions.push(pieceA);
            this.collissions.push(pieceB);
            pieceA.setState(ENUMS.PieceActivationStates.BURST);
            pieceB.setState(ENUMS.PieceActivationStates.BURST);


            if (pieceA.spatial.getVelVec().getLength() > pieceB.spatial.getVelVec().getLength()) {
                this.collidePieces(pieceA, pieceB, this.hitNormal)
            } else {
                this.collidePieces(pieceB, pieceA, this.hitNormal)
            }


            pieceA.networkDirty = true;
            pieceB.networkDirty = true;

            this.callbacks.broadcast(pieceA);
            this.callbacks.broadcast(pieceB);
            pieceA.setState(ENUMS.PieceActivationStates.TIME_OUT);
            pieceB.setState(ENUMS.PieceActivationStates.TIME_OUT);
        }
    };

    SpatialProcessor.prototype.collidePieces = function(fastPiece, slowPiece, hitNormal) {

        this.calcVec.setVec(fastPiece.spatial.getPosVec());
        this.calcVec.subVec(slowPiece.spatial.getPosVec());


        this.calcVec2.setVec(fastPiece.spatial.getVelVec());
        this.calcVec3.setVec(slowPiece.spatial.getVelVec());

        // this.calcVec2.addVec(hitNormal);
        // this.calcVec3.subVec(hitNormal);

        this.calcVec.scale(1/this.calcVec.getLength());

        this.calcVec2.subVec(this.calcVec);
        //  this.calcVec2.scale(0.5);


        this.calcVec3.addVec(this.calcVec);
        //  this.calcVec3.scale(0.5);


        fastPiece.spatial.getVelVec().setVec(this.calcVec3);
        slowPiece.spatial.getVelVec().setVec(this.calcVec2);
    };

    return SpatialProcessor;

});
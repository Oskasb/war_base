"use strict";

define([
        'game/worker/GameWorker'
    ],

    function(
        GameWorker
    ) {
        var gameWorker;

        var pieces = [];

        var GameAPI = function() {

        };

        GameAPI.setupGameWorker = function() {
            gameWorker = new GameWorker();
        };

        GameAPI.initGame = function() {

        };

        GameAPI.createTerrain = function(options, onData) {

            gameWorker.post(['createTerrain', JSON.stringify(options)], onData)
        };

        GameAPI.registerActivePiece = function(piece) {
            gameWorker.registerPieceStates(piece)
        };

        GameAPI.registerPieceControls = function(piece, pieceControls, stateMap) {
            gameWorker.bindPieceControls(piece, pieceControls, stateMap)
        };

        GameAPI.addPiece = function(piece) {
            this.removePiece(piece);
            pieces.push(piece);
        };

        GameAPI.removePiece = function(piece) {
            if (pieces.indexOf(piece) !== -1) {
                pieces.splice(pieces.indexOf(piece), 1);
            }
        };

        GameAPI.tickGame = function(tpf, time) {
            for (var i = 0; i < pieces.length; i++) {
                pieces[i].updateGamePiece(tpf, time);
            }
        };

        return GameAPI;
    });


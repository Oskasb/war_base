"use strict";

define([
        'game/worker/GameWorker'
    ],

    function(
        GameWorker
    ) {
        var gameWorker;


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

        return GameAPI;
    });


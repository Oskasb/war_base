"use strict";

define([
        'game/GameCommander',
        'game/levels/LevelBuilder',
        'game/worker/GameWorker',
        'game/worker/io/ConfigPublisher'
    ],

    function(
        GameCommander,
        LevelBuilder,
        GameWorker,
        ConfigPublisher
    ) {


        var gameCommander;
        var gameWorker;
        var levelBuilder;
        var configPublisher = ConfigPublisher;

        var pieces = [];
        var actors = [];
        var levels = [];

        var workerReady = function() {
            configPublisher.publishConfigs(gameWorker)
        };

        var GameAPI = function() {

        };

        GameAPI.setupGameWorker = function() {

            levelBuilder = new LevelBuilder(GameAPI);
            gameWorker = new GameWorker(workerReady);
            gameCommander = new GameCommander(GameAPI, gameWorker, levelBuilder)

        };

        GameAPI.initGame = function() {

        };

        GameAPI.getActorById = function(id) {
            return gameCommander.getEntryById(actors, id)
        };

        GameAPI.getLevelById = function(id) {
            return gameCommander.getEntryById(levels, id)
        };

        GameAPI.createLevel = function(options, onRes) {
            gameCommander.initLevel(levels, options, onRes)
        };

        GameAPI.closeLevel = function(level) {
            gameCommander.removeLevel(level)
        };


        GameAPI.controlActor = function(actor) {
            gameCommander.enableActorControls(actor)
        };

        GameAPI.createActor = function(options, onRes) {
            gameCommander.createGameActor(options, onRes)
        };


        GameAPI.addActor = function(actor) {
            this.addPiece(actor.piece);
            actors.push(actor)
        };

        GameAPI.dropActorControl = function(actor) {
            gameCommander.disableActorControls(actor)
        };


        GameAPI.removeActor = function(actor, onRes) {
            gameCommander.removeGameActor(actors, actor, onRes)
        };

        GameAPI.addPiece = function(piece) {
            GameAPI.removePiece(piece);
            pieces.push(piece)
        };

        GameAPI.removePiece = function(piece) {
            gameCommander.removeArrayEntry(pieces, piece);
        };

        GameAPI.tickGame = function(tpf, time) {
            for (var i = 0; i < pieces.length; i++) {
                pieces[i].determineVisibility();
                pieces[i].updateGamePiece(tpf, time)
            }

            for (i = 0; i < actors.length; i++) {
                actors[i].updateActpr()
            }
        };

        return GameAPI;
    });


"use strict";

define([
        'game/GameCommander',
        'game/levels/LevelBuilder',
        'game/worker/GameWorker',
        'game/worker/io/ConfigPublisher',
        'ui/particle/GuiAPI'
    ],

    function(
        GameCommander,
        LevelBuilder,
        GameWorker,
        ConfigPublisher,
        GuiAPI
    ) {


        var gameCommander;
        var gameWorker;
        var levelBuilder;
        var configPublisher = ConfigPublisher;

        var pieces = [];
        var staticPieces = [];
        var controls = [];
        var actors = [];
        var levels = [];

        var activeCameraControl;
        var activeControl;
        var controlledActor;
        var selectedActor;


        var GameAPI = function() {

        };

        GameAPI.setupGameWorker = function(systemReady) {

            var configsPublished = function() {
                systemReady();
            };

            var workerReady = function() {
                configPublisher.publishConfigs(gameWorker, configsPublished)
            };

            gameWorker = new GameWorker(workerReady);

        };

        GameAPI.initGameSystems = function() {
            console.log(" -- > INIT GAME < -- ");
            levelBuilder = new LevelBuilder(GameAPI);
            gameCommander = new GameCommander(GameAPI, gameWorker, levelBuilder);
        };

        GameAPI.initGameGui = function() {
            console.log(" -- > INIT GUI < -- ");
            GuiAPI.initGuiApi(GameAPI);
        };

        GameAPI.getPieceById = function(id) {

            if (id === controlledActor.piece.id) {
                return controlledActor.piece;
            }

            return gameCommander.getEntryById(pieces, id)
        };

        GameAPI.countCombatPieces = function() {
            var count = 0;

            for (i = 0; i < pieces.length; i++) {
                if (pieces[i].getCombatStatus()) {
                    count++
                }
            }

            return count;
        };

        GameAPI.getPieces = function() {
            return pieces;
        };

        GameAPI.getGameCommander = function() {
            return gameCommander;
        };

        GameAPI.getGameWorker = function() {
            return gameWorker;
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

        GameAPI.createControl = function(id, onRes) {
            gameCommander.createGuiControl(id, onRes)
        };

        GameAPI.createCameraControls = function(id, onRes) {
            gameCommander.createCameraControlSystem(id, onRes)
        };

        GameAPI.controlActor = function(actor) {
            GameAPI.removePiece(actor.piece);
            controlledActor = actor;
            gameCommander.enableActorControls(actor)
        };



        GameAPI.selectionActivatedActor = function(actor) {
            gameCommander.setSelectionActiveActor(actor)
        };

        GameAPI.getSelectionActivatedActor = function() {
            return gameCommander.getSelectionActiveActor()
        };

        GameAPI.setSelectedActor = function(actor) {
            selectedActor = actor;
        };

        GameAPI.getSelectedActor = function(actor) {
            return selectedActor;
        };

        GameAPI.setActiveCameraControl = function(camCtrl) {
            activeCameraControl = camCtrl;
        };

        GameAPI.getActiveCameraControl = function() {
            return activeCameraControl;
        };

        GameAPI.getControlledActor = function() {
            return controlledActor;
        };


        GameAPI.createActor = function(options, onRes) {
            gameCommander.createGameActor(options, onRes)
        };


        GameAPI.addActor = function(actor) {


            if (actor.getMass() > 0) {
                this.addPiece(actor.piece);
            } else {
                this.addStaticPiece(actor.piece);
            }


            if (actors.indexOf(actor === -1)) {
                actors.push(actor)
            }

        };

        GameAPI.getActors = function() {
            return actors;
        };

        GameAPI.dropActorControl = function(actor) {
            controlledActor = null;
            gameCommander.disableActorControls(actor, activeControl);
            GameAPI.addPiece(actor.piece);
        };


        GameAPI.removeActor = function(actor, onRes) {
            gameCommander.removeGameActor(actor, onRes)
        };

        GameAPI.addPiece = function(piece) {
            GameAPI.removePiece(piece);
            pieces.push(piece)
        };

        GameAPI.addStaticPiece = function(piece) {
            GameAPI.removeStaticPiece(piece);
            staticPieces.push(piece);
            piece.updateGamePiece(0.01);
        };

        GameAPI.removePiece = function(piece) {
            gameCommander.removeArrayEntry(pieces, piece);
        };

        GameAPI.removeStaticPiece = function(piece) {
            gameCommander.removeArrayEntry(staticPieces, piece);
        };

        GameAPI.addGuiControl = function(ctrlSys) {
            GameAPI.removeGuiControl(ctrlSys);
            controls.push(ctrlSys)
        };

        GameAPI.removeGuiControl = function(ctrlSys) {
            gameCommander.removeArrayEntry(controls, ctrlSys);
            gameCommander.removeGuiControl(ctrlSys);
        };

        GameAPI.setActiveControlSys = function(ctrlSys) {
            activeControl = ctrlSys;
        };

        GameAPI.getActiveControlSys = function() {
            return activeControl;
        };

        var i;

        GameAPI.tickControls = function(tpf) {

            for (i = 0; i < controls.length; i++) {
                controls[i].updateGuiControl(tpf)
            }

            if (activeCameraControl && activeControl) {
                activeCameraControl.updateCameraCopntrol(activeControl, controlledActor, tpf);
            }

            GuiAPI.updateGui();
        };

        GameAPI.tickPlayerPiece = function(tpf) {

            if (controlledActor) {
                controlledActor.piece.setRendereable(true);
                controlledActor.piece.updatePieceStates(tpf);
                controlledActor.piece.updatePieceSlots(tpf);
                controlledActor.piece.updatePieceVisuals(tpf);
            }
        };

        GameAPI.tickGame = function(tpf, time) {

            for (i = 0; i < pieces.length; i++) {
                pieces[i].updateGamePiece(tpf, time)
            }

            for (i = 0; i < staticPieces.length; i++) {
                staticPieces[i].updateStaticGamePiece(tpf, time)
            }

        };

        return GameAPI;
    });


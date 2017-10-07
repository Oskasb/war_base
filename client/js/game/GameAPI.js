"use strict";

define([
        'game/GameCommander',
        'game/levels/LevelBuilder',
        'game/worker/GameWorker',
        'game/worker/io/ConfigPublisher',
        'io/GuiRenderer'
    ],

    function(
        GameCommander,
        LevelBuilder,
        GameWorker,
        ConfigPublisher,
        GuiRenderer
    ) {


        var gameCommander;
        var gameWorker;
        var levelBuilder;
        var configPublisher = ConfigPublisher;
        var guiRenderer;

        var pieces = [];
        var controls = [];
        var actors = [];
        var levels = [];

        var activeCameraControl;
        var activeControl;
        var controlledActor;
        var selectedActor;

        var workerReady = function() {
            configPublisher.publishConfigs(gameWorker)
        };

        var GameAPI = function() {

        };

        GameAPI.setupGameWorker = function() {
            guiRenderer = new GuiRenderer(GameAPI);
            levelBuilder = new LevelBuilder(GameAPI);
            gameWorker = new GameWorker(workerReady);
            gameCommander = new GameCommander(GameAPI, gameWorker, levelBuilder)

        };

        GameAPI.initGame = function() {

        };

        GameAPI.getPieceById = function(id) {

            if (id === controlledActor.piece.id) {
                return controlledActor.piece;
            }

            return gameCommander.getEntryById(pieces, id)
        };

        GameAPI.countCombatPieces = function() {
            var count = 0;

            for (var i = 0; i < pieces.length; i++) {
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
            this.addPiece(actor.piece);
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

        GameAPI.removePiece = function(piece) {
            gameCommander.removeArrayEntry(pieces, piece);
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

        GameAPI.tickControls = function(tpf) {

            for (var i = 0; i < controls.length; i++) {
                controls[i].updateGuiControl(tpf)
            }

            if (activeCameraControl && activeControl) {
                activeCameraControl.updateCameraCopntrol(activeControl, controlledActor, tpf);
            }
            guiRenderer.requestCameraMatrixUpdate();
        };

        GameAPI.tickPlayerPiece = function(tpf) {

            for (var i = 0; i < pieces.length; i++) {
                pieces[i].determineVisibility();
            }

            guiRenderer.updateGuiRenderer();

            if (controlledActor) {
                controlledActor.piece.setRendereable(true);
            //    controlledActor.piece.determineVisibility();

            //    controlledActor.piece.updateGamePiece(tpf);
                controlledActor.piece.updatePieceStates(tpf);
                controlledActor.piece.updatePieceSlots(tpf);
                controlledActor.piece.updatePieceVisuals(tpf);
            }
        };

        GameAPI.tickGame = function(tpf, time) {

            for (var i = 0; i < actors.length; i++) {
                actors[i].piece.checkNeedsUpdate(actors[i]);
            }

            for (var i = 0; i < pieces.length; i++) {
                pieces[i].updateGamePiece(tpf, time)
            }

        };

        return GameAPI;
    });


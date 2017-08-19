"use strict";

define([
    'PipelineAPI',
        'game/worker/GameWorker'
    ],

    function(
        PipelineAPI,
        GameWorker
    ) {
        var gameWorker;

        var pieces = [];


        var GameAPI = function() {

        };

        GameAPI.setupGameWorker = function() {

            var fileList = function(src, data) {
                GameAPI.updateWorkerConfigs(data);
            };

            var pipeLoaded = false;
            var workerLoaded = false;

            var checkBoth = function() {
                if (pipeLoaded && workerLoaded) {
                    PipelineAPI.subscribeToCategoryKey('config_url_index', 'files', fileList);
                }
            };

            var pipeProgress = function(started, remainig) {
                console.log(remainig)
                if (started > 3 && remainig === 0) {
                    pipeLoaded = true;
                    PipelineAPI.removeProgressCallback(pipeProgress);
                    checkBoth();
                }
            };


            var pipeReady = function () {
                PipelineAPI.addProgressCallback(pipeProgress)
            };

            var workerReady = function() {
                workerLoaded = true;
                checkBoth();
            };

            PipelineAPI.addReadyCallback(pipeReady);
            gameWorker = new GameWorker(workerReady);

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

        var postConfig = function(src, conf) {
            gameWorker.storeConfig(src, conf);
        };

        GameAPI.updateWorkerConfigs = function(data) {

            var urls = PipelineAPI.getCachedConfigs()['urls'];

            for (var i = 0; i < data.length; i++) {
                var file = data[i];
                var conf = urls['client/json/'+file];
                if (conf) {
                    for (var j = 0; j < conf.length; j++) {
                        for (var key in conf[j]) {
                            PipelineAPI.subscribeToCategoryUpdate(key, postConfig);
                        }
                    }
                }
            }
        };

        return GameAPI;
    });


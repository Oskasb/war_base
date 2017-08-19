"use strict";

define(['game/worker/DataProtocol'],
    function(DataProtocol) {

        var GameWorker = function() {

            this.callbacks = {};
            this.pieceProtocolMap = {};
            this.worker = new Worker('./client/js/game/worker/MainGameWorker.js');
            this.worker.onmessage = function(msg) {
                this.handleMessage(msg)
            }.bind(this);

        };

        GameWorker.prototype.handleMessage = function(msg) {
        //    console.log("Hande Game Worker Message", msg);

            if (this.pieceProtocolMap[msg.data[0]]) {
             //   console.log("Piece protocol message: ", msg);
                this.pieceProtocolMap[msg.data[0]].recieveMessage(msg.data);
                return;
            }

            if (typeof(this.callbacks[msg.data[0]]) === 'function') {
                this.callbacks[msg.data[0]](msg.data[1]);
                delete this.callbacks[msg.data[0]];
                return;
            }

            if (msg.data[0] === 'ready') {
                this.worker.postMessage(['ping', [new Date().getTime()]]);
            }
        };

        GameWorker.prototype.post = function(msg, onData) {
            this.callbacks[msg[0]] = onData;
            this.worker.postMessage(msg);
        };

        GameWorker.prototype.registerPieceStates = function(piece) {
            this.pieceProtocolMap[piece.pieceNr] = new DataProtocol(piece.pieceNr, piece.pieceStates, this.worker);
        };

        GameWorker.prototype.bindPieceControls = function(piece, controlPiece, controlStateMap) {

            this.registerPieceStates(piece);
            this.registerPieceStates(controlPiece);

            var dataProtocol = this.pieceProtocolMap[controlPiece.pieceNr];

            for (var key in controlStateMap.controlStates) {
                var callback = function(src, value) {
                    dataProtocol.postState(src, value)
                };
                controlStateMap.setStateIdCallback(key, callback);
            }

            dataProtocol.mapTargetChannels(piece, controlStateMap);

        };

        return GameWorker;
    });

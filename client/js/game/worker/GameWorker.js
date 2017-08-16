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

        GameWorker.prototype.registerPieceStates = function(pieceNr, pieceStates) {
            var dataProtocol = new DataProtocol(pieceNr, pieceStates);
            this.pieceProtocolMap[dataProtocol.ptcNr] = dataProtocol;
            this.worker.postMessage(['registerProtocol', dataProtocol.protocol]);
        };

        return GameWorker;
    });

"use strict";

define([],
    function() {

    var protocols = 0;

        var DataProtocol = function(pieceKey, pieceStates) {

            protocols++;
            this.ptcNr = protocols;

            this.stateKeyMap = {};
            this.protocol = [this.ptcNr, pieceKey];

            for (var i = 0; i < pieceStates.length; i++) {
                this.addStateChannel(pieceStates[i])
            }
            this.protocol.push(new Date().getTime());
        };

        DataProtocol.prototype.recieveMessage = function(data) {
            for (var i = 2; i < data.length-1; i++) {
                this.setStateValue(data[i], data[i+1], data[data.length-1]);
                i++;
            }
        };

        DataProtocol.prototype.getStateProtocolIndex = function(stateKey) {

        };

        DataProtocol.prototype.setStateValue = function(stateKey, value, time) {
            if (!this.stateKeyMap[this.protocol.indexOf(stateKey)]) {
                console.log("No", stateKey, this.protocol);
                return;
            }
            this.stateKeyMap[this.protocol.indexOf(stateKey)].setValueAtTime(value, time);
        };

        DataProtocol.prototype.addStateChannel = function(state) {
            this.protocol.push(state.id);
            var stateIdx = this.protocol.indexOf(state.id);
            this.protocol.push(state.getValue());
            this.stateKeyMap[stateIdx] = state;
        };

        DataProtocol.prototype.getStateChannel = function(stateKey, value) {

        };

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

"use strict";

define(['game/worker/DataProtocol'],
    function(DataProtocol) {

        var calls = 0;

        var Call = function(callback) {
            calls++;
            this.idx = calls;
            this.callback = callback;
        };

        Call.prototype.res = function(msg) {
            this.callback(msg);
        };


        var GameWorker = function(workerReady) {

            this.callbacks = [new Call(workerReady)];

            this.executors = {};

            this.pieceProtocolMap = {};
            this.worker = new Worker('./client/js/game/worker/MainGameWorker.js');
            this.worker.onmessage = function(msg) {
                this.handleMessage(msg)
            }.bind(this);

        };



        GameWorker.prototype.setExecutor = function(functionName, callback) {
            this.executors[functionName] = callback;
        };

        GameWorker.prototype.handleMessage = function(msg) {
        //    console.log("Hande Game Worker Message", msg);

            if (this.pieceProtocolMap[msg.data[0]]) {
             //   console.log("Piece protocol message: ", msg);
                this.pieceProtocolMap[msg.data[0]].recieveMessage(msg.data);
                return;
            }

            if (this.executors[msg.data[0]]) {
                this.executors[msg.data[0]](msg.data);
                return;
            }

            for (var i = 0; i < this.callbacks.length; i++) {
                if (this.callbacks[i].idx === msg.data[0]) {
                    this.callbacks[i].res(msg.data[1]);
                    this.callbacks.splice(i, 1);
                    return;
                }
            }

            console.log("Something not ok with worker callback stack", msg, this.callbacks);

        };

        GameWorker.prototype.post = function(msg, onData) {
            this.callbacks[msg[0]] = onData;
            this.worker.postMessage(msg);
        };

        GameWorker.prototype.makeGameRequest = function(requestName, data, callback) {


            var call = new Call(callback);

            this.callbacks.push(call);

            if (typeof(data) === 'object') {
                data = JSON.stringify(data);
            };

            this.worker.postMessage(['gameRequest', [requestName, call.idx, data]]);

        };

        GameWorker.prototype.registerActorPieceStates = function(actor) {
            this.pieceProtocolMap[actor.id] = new DataProtocol(actor.id, actor.piece.pieceStates, this.worker);
        };

        GameWorker.prototype.unregisterPieceStates = function(actor) {
            delete this.pieceProtocolMap[actor.id];
        };

        GameWorker.prototype.bindActorControls = function(actor, ctrlSys) {
            var controlStateMap = actor.controlStateMap;
            this.registerActorPieceStates(actor);
            this.registerActorPieceStates(ctrlSys);

            var dataProtocol = this.pieceProtocolMap[ctrlSys.id];

            for (var key in controlStateMap.controlStates) {

                    var callback = function(src, value) {
                        dataProtocol.postState(src, value)
                    };
                    controlStateMap.addStateIdCallback(key, callback);
            }

            dataProtocol.mapTargetChannels(actor, controlStateMap);
        };

        GameWorker.prototype.clearActorControls = function(actor, controlStateMap) {
            controlStateMap.clearControlState();
            this.unregisterPieceStates(actor);
        };

        GameWorker.prototype.storeConfig = function(confId, key, data) {
            var json = JSON.stringify(data);
            this.worker.postMessage(['storeConfig', [confId, key, json]]);
        };

        GameWorker.prototype.getCallCount = function() {
            return calls;
        };

        GameWorker.prototype.getCallbackCount = function() {
            return this.callbacks.length;
        };

        GameWorker.prototype.getProtocolCount = function() {
            var count = 0;

            for (var key in this.pieceProtocolMap) {
                count++
            }


            return count;
        };

        GameWorker.prototype.getProtocolUpdateCount = function() {
            var count = 0;

            for (var key in this.pieceProtocolMap) {
                count += this.pieceProtocolMap[key].messageCount;
                this.pieceProtocolMap[key].messageCount = 0;
            }

            return count;
        };

        return GameWorker;
    });

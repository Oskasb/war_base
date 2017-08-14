"use strict";

define([],
    function() {


        var GameWorker = function() {

            this.callbacks = {};

            this.worker = new Worker('./client/js/game/worker/MainGameWorker.js');

            this.worker.onmessage = function(msg) {
                this.handleMessage(msg)
            }.bind(this);

        };

        GameWorker.prototype.handleMessage = function(msg) {
            console.log("Hande Game Worker Message", msg);

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


        return GameWorker;

    });

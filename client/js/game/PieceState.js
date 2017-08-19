
"use strict";


define([],
    function() {

        var PieceState = function(id, value) {
            this.id = id;
            this.value = 0;
            this.startValue = value;

            this.callbacks = [];

            this.targetTime = 0;
            this.targetValue = value;
            this.lastUpdate = 0;
            this.stateProgress = 0;

            var state = [value, 0];

            if (window.SharedArrayBuffer) {
                var buffer = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * state.length);
                this.buffer = new Float32Array(buffer);
                console.log(this.buffer)
            } else {
                this.buffer = state;
            }
            this.setValueAtTime(value, 0);
        };

        PieceState.prototype.setValue = function (value) {
            this.value = value;
            this.notifyUpdate();
        };


        PieceState.prototype.notifyUpdate = function () {
            for (var i = 0; i < this.callbacks.length; i++) {
                this.callbacks[i](this.id, this.value);
            }
        };

        PieceState.prototype.addCallback = function (callback) {
            this.removeCallback(callback);
            this.callbacks.push(callback);
        };

        PieceState.prototype.removeCallback = function (callback) {
            if (this.callbacks.indexOf(callback) !== -1) {
                this.callbacks.splice(this.callbacks.indexOf(callback), 1);
            }
        };

        PieceState.prototype.getValue = function () {
            return this.value;
        };

        PieceState.prototype.setValueAtTime = function(value, time) {
            this.buffer[0] = value;
            this.buffer[1] = time;
        };

        PieceState.prototype.getValueRunded = function (factor) {
            return Math.round(this.value*factor)/factor;
        };

        PieceState.prototype.updateTargetValues = function () {
           this.targetValue = this.buffer[0];
            this.targetTime = this.buffer[1];
            this.stateProgress = 0;
            this.startValue = this.value;
        };

        PieceState.prototype.updateStateProgress = function (tpf) {
            this.stateProgress += tpf;

            if (this.stateProgress < this.targetTime) {
                var frac = MATH.calcFraction(0, this.targetTime, this.stateProgress);
                this.setValue(MATH.interpolateFromTo(this.startValue, this.targetValue, frac));
            } else {
                this.setValue(this.targetValue);
            };
        };

        PieceState.prototype.updateStateFrame = function (tpf, time) {

            if (this.value === this.buffer[0]) return;

            this.lastUpdate = time;

            if (this.targetValue !== this.buffer[0]) {
                this.updateTargetValues()
            }
            this.updateStateProgress(tpf);

        };

        return PieceState
    });
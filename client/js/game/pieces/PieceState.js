
"use strict";

// window.SharedArrayBuffer = null;
define([],
    function() {

        var PieceState = function(id, value) {
            this.id = id;
            this.radial = false;
            this.value = 0 || value;
            this.startValue = value;

            this.sampler = null;
            this.callbacks = [];

            this.targetTime = 0;
            this.targetValue = value;
            this.lastUpdate = 0;
            this.stateProgress = 0;

            var state = [this.value, 0, 0];

            if (window.SharedArrayBuffer) {
                var buffer = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * state.length);
                this.buffer = new Float32Array(buffer);
            //    console.log(this.buffer)
            } else {
                this.buffer = state;
            }
            this.setValueAtTime(this.value, 0);
        };

        PieceState.prototype.setValue = function (value) {
            if (isNaN(value)) {
                console.log("Set NaN!", this.id)
                value = Math.random();
                this.buffer[0] = value;
            }
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

        PieceState.prototype.setSampler = function (sampler) {
            this.sampler = sampler;
        };

        PieceState.prototype.getSampler = function () {
            return this.sampler;
        };

        PieceState.prototype.getValue = function () {
            return this.value;
        };

        PieceState.prototype.isRadial = function (bool) {
            this.radial = bool;
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

                if (this.radial) {
                    var add = 0;
                    if ((this.startValue + this.targetValue) > 2) {
                        add = -1;
                    }
                    if ((this.startValue - this.targetValue) < -2) {
                        add = 1;
                    }
                    this.setValue(MATH.interpolateFromTo(this.startValue+add, this.targetValue+add, frac));
                } else {
                    this.setValue(MATH.interpolateFromTo(this.startValue, this.targetValue, frac));
                }

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
            this.notifyUpdate();
        };

        return PieceState
    });
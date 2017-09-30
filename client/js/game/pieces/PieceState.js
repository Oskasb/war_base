
"use strict";

// window.SharedArrayBuffer = null;
define([],
    function() {

        var PieceState = function(id, value) {
            this.id = id;
            this.radial = false;
            this.value = 0 || value;
            this.startValue = value;

            this.dirty = true;

            this.readCount = 0;

            this.timeSinceUpdate = 0;

            this.sampler = null;
            this.callbacks = [];

            this.targetTime = 0;
            this.targetValue = value;
            this.stateProgress = 0;
            this.progressDelta = 0;

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
            this.readCount++;
            return this.value;
        };

        PieceState.prototype.sampleBufferValue = function () {
            this.readCount++;
            return this.buffer[0];
        };

        PieceState.prototype.setBufferValue = function (value) {
            this.readCount = 0;
            this.buffer[0] = value;
            this.dirty = true;
        };

        PieceState.prototype.checkDirty = function () {
            if (this.value !== this.buffer[0]) {
                this.makeDirty();
            } else {
                if (this.readCount > 2) {
                    this.dirty = false;
                }
            }

            this.readCount++
            return this.isDirty();

        };

        PieceState.prototype.makeDirty = function () {
            this.dirty = true;
        };

        PieceState.prototype.isDirty = function () {
            return this.dirty;
        };

        PieceState.prototype.setValueAtTime = function(value, time) {
            this.dirty = true;
            this.readCount = 0;
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

            if (this.stateProgress < this.targetTime && Math.abs(this.startValue-this.targetValue) < 10) {
                var frac = MATH.calcFraction(0, this.targetTime, this.stateProgress);
                this.progressDelta = MATH.calcFraction(0, this.targetTime, tpf);
                this.setValue(MATH.interpolateFromTo(this.startValue, this.targetValue, frac));
                this.readCount = 0;
                this.timeSinceUpdate = 0;
            } else {
                this.setValue(this.targetValue);
                this.progressDelta = 0;
                this.timeSinceUpdate += tpf;
            }
        };

        PieceState.prototype.updateStateFrame = function (tpf) {

            if (this.value === this.buffer[0]) {
                return;
            }


            if (this.targetValue !== this.buffer[0]) {
                this.updateTargetValues()
            }
            this.updateStateProgress(tpf);
            this.notifyUpdate();

        };

        return PieceState
    });
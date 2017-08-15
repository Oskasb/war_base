
"use strict";


define([],
    function() {

        var PieceState = function(id, value) {
            this.id = id;
            this.value = value;
            this.startValue = value;

            this.messageTime = 0;
            this.targetTime = 0;
            this.targetValue = value;
        };

        PieceState.prototype.setValue = function (value) {
            this.value = value;
        };

        PieceState.prototype.getValue = function () {
            return this.value;
        };

        PieceState.prototype.setValueAtTime = function(value, time) {
            if (value === this.value) {
                return;
            };
            this.messageTime = new Date().getTime()*0.001;
            this.startValue = this.value;
            this.targetTime = time;
            this.targetValue = value;
        };

        PieceState.prototype.getValueRunded = function (factor) {
            return Math.round(this.value*factor)/factor;
        };

        PieceState.prototype.updateStateFrame = function (tpf, time) {
            if (this.targetTime > time+tpf) {
                var frac = MATH.calcFraction(this.messageTime, this.targetTime, time);
                this.setValue(MATH.interpolateFromTo(this.startValue, this.targetValue, frac));
            } else {
                this.setValue(this.targetValue);
            };
        };

        return PieceState
    });
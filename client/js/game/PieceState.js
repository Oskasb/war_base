
"use strict";


define([],
    function() {

        var PieceState = function(id, value) {
            this.id = id;
            this.value = value;
        };

        PieceState.prototype.setValue = function (value) {
            this.value = value;
        };

        PieceState.prototype.getValue = function () {
            return this.value;
        };

        PieceState.prototype.getValueRunded = function (factor) {
            return Math.round(this.value*factor)/factor;
        };

        return PieceState
    });
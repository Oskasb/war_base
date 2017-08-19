
"use strict";


define([],
    function() {

        var ControlStateMap = function() {
            this.callbacks = {};
            this.controlStates = {};
            this.controlTarget = {};
        };

        ControlStateMap.prototype.addControlState = function (controlState, targetState) {
            this.controlStates[controlState.id] = controlState;
            if (!this.controlTarget[controlState.id]) {
                this.controlTarget[controlState.id] = [];
            }
            this.controlTarget[controlState.id].push(targetState);
        };

        ControlStateMap.prototype.addStateIdCallback = function (controlStateId, callback) {
            this.controlStates[controlStateId].addCallback(callback);
            if (!this.callbacks[controlStateId]) {
                this.callbacks[controlStateId] = [];
            }
            this.callbacks[controlStateId].push(callback);
        };

        ControlStateMap.prototype.removeControlState = function (controlStateId) {
            for (var i = 0; i < this.callbacks[controlStateId].length; i++) {
                this.controlStates[controlStateId].removeCallback(this.callbacks[controlStateId][i]);
            }
            this.callbacks[controlStateId] = [];
            delete this.controlStates[controlStateId];
            delete this.controlTarget[controlStateId]
        };

        ControlStateMap.prototype.clearControlState = function () {
            for (var key in this.controlStates) {
                this.removeControlState(key);
            }
        };

        return ControlStateMap
    });
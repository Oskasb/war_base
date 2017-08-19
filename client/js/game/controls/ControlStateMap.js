
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
            this.controlTarget[controlState.id] = targetState;
        };

        ControlStateMap.prototype.setStateIdCallback = function (controlStateId, callback) {
            this.controlStates[controlStateId].addCallback(callback);
            this.callbacks[controlStateId] = callback;
        };

        ControlStateMap.prototype.removeControlState = function (controlStateId) {
            this.controlStates[controlStateId].removeCallback(this.callbacks[controlStateId]);
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
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
                i++;
            }
        };

        DataProtocol.prototype.getStateProtocolIndex = function(stateKey) {

        };

        DataProtocol.prototype.setStateValue = function(stateIndex, value, time) {
            if (!this.stateKeyMap[stateIndex]) {
                console.log("No", stateIndex, this.protocol);
                return;
            }
        //    this.stateKeyMap[stateIndex].setValueAtTime(value, time);
            this.stateKeyMap[stateIndex].buffer[0] = value;
            this.stateKeyMap[stateIndex].buffer[1] = time;
        };

        DataProtocol.prototype.addStateChannel = function(state, buffer) {
            this.protocol.push(state.id);
            var stateIdx = this.protocol.indexOf(state.id);
            this.protocol.push(state.getValue());
            this.protocol.push(state.buffer);
            this.stateKeyMap[stateIdx] = state;
        };

        DataProtocol.prototype.getStateChannel = function(stateKey, value) {

        };

        return DataProtocol
    });

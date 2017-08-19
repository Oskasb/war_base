"use strict";

define([], function() {

        var ProtocolSystem = function() {
            this.protocols = {};
            this.targetMap = {};
        };

        ProtocolSystem.prototype.handleMessage = function(msg) {

            if (this.protocols[msg[0]]) {
                this.handleProtocolMessage(msg);
                return;
            }

            if (typeof(this[msg[0]]) === 'function') {
                this[msg[0]](msg[0], msg[1])
            } else {
                console.log("No function", msg[0])
            }
            console.log("-- >Worker Game Message", msg)
        };

        ProtocolSystem.prototype.mapProtocolTargets = function(msg) {
            this.targetMap[msg[0]] = msg[1];
        };

        ProtocolSystem.prototype.contains = function(msgName) {
            if (this.protocols[msgName]) {
                return true;
            }
        };

        ProtocolSystem.prototype.addProtocol = function(protocol) {
            this.protocols[protocol[0]] = protocol;
        };

        ProtocolSystem.prototype.handleProtocolMessage = function(protocol) {

            if (!this.targetMap[protocol[0]]) {
                console.log("No target map", this.targetMap, protocol);
                return;
            }

            var channels = this.targetMap[protocol[0]];

            var target = this.protocols[protocol[1]];

            var msg = [target[0], target[1]];


            var addStateToMessage = function(channelKey, targetKey) {

                var sourceChannel = protocol.indexOf(channelKey); //2 + 3 * Math.floor(Math.random()*channelCount);
                var targetChannel = target.indexOf(targetKey);

                target[targetChannel+1] = protocol[sourceChannel+1];

                if (self.SharedArrayBuffer) {
                    target[targetChannel+2][0] = target[targetChannel+1];
                    target[targetChannel+2][1] = 0.2;
                } else {
                    msg.push(targetChannel);
                    msg.push(target[targetChannel+1]);
                }

            };

            for (var i = 0; i < channels.length; i++) {
                addStateToMessage(channels[i], channels[i+1]);
                i++
            }

            if (self.SharedArrayBuffer) return;

            msg.push(0.2);
            self.postMessage(msg);
        };



        return ProtocolSystem;

    });

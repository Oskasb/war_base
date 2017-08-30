"use strict";

define([
        'PipelineAPI',
        'worker/simulation/SimulationRequests',
        'worker/simulation/SimulationState'
    ],
    function(
        PipelineAPI,
        SimulationRequests,
        SimulationState
    ) {

        var GameSimulation = function(Ammo, protocolSystem) {

            this.simulationState = new SimulationState(Ammo, protocolSystem);
            this.simulationRequests = new SimulationRequests(this.simulationState);
        };

        GameSimulation.prototype.processRequest = function(msg) {
            if (typeof(this.simulationRequests[msg[0]]) === 'function') {
                this.simulationRequests[msg[0]](msg[1], msg[2])
            } else {
                console.log("No simulationRequests", msg[0])
            }
        };


        GameSimulation.prototype.updateSimulation = function(tpf) {
            this.simulationState.updateState(tpf);
        };

        GameSimulation.prototype.runGameLoop = function(tpf) {

            console.log("Run Worker Game Loop", tpf);

            clearInterval(this.gameLoop);

            var frameTime = tpf;

            var update = function() {
                this.updateSimulation(frameTime)
            }.bind(this);

            this.gameLoop = setInterval(update, tpf*1000);
        };

        GameSimulation.prototype.stopGameLoop = function() {
            clearInterval(this.gameLoop);
        };

        return GameSimulation;

    });


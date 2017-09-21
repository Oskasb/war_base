"use strict";

define([
        'PipelineAPI',
        'worker/simulation/SimulationRequests',
        'worker/grid/ActivationGrid',
        'worker/simulation/SimulationState'
    ],
    function(
        PipelineAPI,
        SimulationRequests,
        ActivationGrid,
        SimulationState
    ) {

    var workerReadyCB;

        var GameSimulation = function(onWorkerReady, protocolSystem) {
            workerReadyCB = onWorkerReady;
            this.activationGrid = null;
            this.simulationState = new SimulationState(protocolSystem);
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


        var gameLoop;

        GameSimulation.prototype.runGameLoop = function(tpf) {

            console.log("Run Worker Game Loop", tpf);
            workerReadyCB();
            var activationGrid;

            var gridReady = function() {

                activationGrid.createActivationGrid(this.simulationState);

                this.simulationState.setActivationGrid(activationGrid);

                var frameTime = tpf;

                var update = function() {
                    var controlledActor = this.simulationState.getControlledActor();
                    if (controlledActor) {
                        activationGrid.updateActivationGrid(controlledActor.piece.getPos());
                    }

                    this.updateSimulation(frameTime)
                }.bind(this);

                gameLoop = setInterval(update, tpf*1000);
            }.bind(this);

            activationGrid = new ActivationGrid(gridReady);

            clearInterval(gameLoop);

        };

        GameSimulation.prototype.stopGameLoop = function() {
            clearInterval(gameLoop);
        };

        return GameSimulation;

    });


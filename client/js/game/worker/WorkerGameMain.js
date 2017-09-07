"use strict";

define([
        'PipelineAPI',
        'worker/physics/CannonAPI',
        'worker/terrain/TerrainFunctions',
        'worker/io/ProtocolSystem',
        'worker/simulation/GameSimulation'
    ],
    function(
        PipelineAPI,
        CannonAPI,
        TerrainFunctions,
        ProtocolSystem,
        GameSimulation
    ) {


        var WorkerGameMain = function(Ammo) {
            this.protocolSystem = new ProtocolSystem();
            this.gameSimulation = new GameSimulation(Ammo, this.protocolSystem);
            this.gameSimulation.runGameLoop(0.06);
        };

        WorkerGameMain.prototype.handleMessage = function(msg) {

            if (this.protocolSystem.contains([msg[0]])) {
                this.protocolSystem.handleProtocolMessage(msg);
                return;
            }

            if (typeof(this[msg[0]]) === 'function') {
                this[msg[0]](msg[1])
            } else {
                console.log("No function", msg[0])
            }
        };

        WorkerGameMain.prototype.registerProtocol = function(protocol) {
            this.protocolSystem.addProtocol(protocol);
        };

        WorkerGameMain.prototype.storeConfig = function(config) {
            PipelineAPI.setCategoryKeyValue(config[0], config[1], JSON.parse(config[2]))
        };

        WorkerGameMain.prototype.mapTarget = function(protocol) {
            this.protocolSystem.mapProtocolTargets(protocol);
        };

        WorkerGameMain.prototype.gameRequest = function(request) {
            this.gameSimulation.processRequest(request);
        };

        return WorkerGameMain;

    });


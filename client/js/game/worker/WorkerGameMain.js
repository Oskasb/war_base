"use strict";

define([
        'PipelineAPI',
        'worker/terrain/TerrainFunctions',
        'worker/io/ProtocolSystem',
        'worker/simulation/GameSimulation',
        'three/ThreeModelLoader'

    ],
    function(
        PipelineAPI,
        TerrainFunctions,
        ProtocolSystem,
        GameSimulation,
        ThreeModelLoader
    ) {

        var onModelsOk;

        var loaded = false;

        var WorkerGameMain = function(onWorkerReady) {
            onModelsOk = onWorkerReady;

            this.protocolSystem = new ProtocolSystem();
            this.gameSimulation = new GameSimulation(onWorkerReady, this.protocolSystem);
            this.gameSimulation.runGameLoop(0.05);


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
            PipelineAPI.setCategoryKeyValue(config[0], config[1], JSON.parse(config[2]));

            if (!loaded) {
                ThreeModelLoader.loadPhysicsData(onModelsOk);
                loaded = true;
            }
        };

        WorkerGameMain.prototype.mapTarget = function(protocol) {
            this.protocolSystem.mapProtocolTargets(protocol);
        };

        WorkerGameMain.prototype.gameRequest = function(request) {
            this.gameSimulation.processRequest(request);
        };

        return WorkerGameMain;

    });


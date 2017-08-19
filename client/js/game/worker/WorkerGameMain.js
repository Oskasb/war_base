"use strict";

define(['worker/physics/CannonAPI',
        'worker/terrain/TerrainFunctions',
        'worker/io/ProtocolSystem'
    ],
    function(
        CannonAPI,
        TerrainFunctions,
        ProtocolSystem
    ) {

        var WorkerGameMain = function() {
            this.protocolSystem = new ProtocolSystem();
            this.cannonApi = new CannonAPI();
            this.terrainFunctions = new TerrainFunctions(this.cannonApi)
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
            console.log("-- >Worker Game Message", msg)
        };

        WorkerGameMain.prototype.createTerrain = function(options) {
            console.log("opts:", options);
            var array = this.terrainFunctions.createTerrainArray1d(JSON.parse(options));
            this.postToMain(['createTerrain', array]);
        };


        WorkerGameMain.prototype.registerProtocol = function(protocol) {
            this.protocolSystem.addProtocol(protocol);
        };

        WorkerGameMain.prototype.mapTarget = function(protocol) {
            this.protocolSystem.mapProtocolTargets(protocol);
        };


        WorkerGameMain.prototype.postToMain = function(msg) {
            postMessage(msg);
        };

        return WorkerGameMain;

    });

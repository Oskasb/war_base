"use strict";

define(['worker/physics/CannonAPI',
        'worker/terrain/TerrainFunctions'
    ],
    function(
        CannonAPI,
        TerrainFunctions
    ) {

        var WorkerGameMain = function() {
            this.cannonApi = new CannonAPI();
            this.terrainFunctions = new TerrainFunctions(this.cannonApi)
        };

        WorkerGameMain.prototype.handleMessage = function(msg) {
            if (typeof(this[msg[0]]) === 'function') {
                this[msg[0]](msg[0], JSON.parse(msg[1]))
            } else {
                console.log("No function", msg[0])
            }
            console.log("-- >Worker Game Message", msg)
        };

        WorkerGameMain.prototype.createTerrain = function(msgName, options) {
            console.log("opts:", options);
            var array = this.terrainFunctions.createTerrainArray1d(options);
            this.postToMain([msgName, array]);
        };

        WorkerGameMain.prototype.saveJsonData = function(json, url) {
            this.worker.postMessage(['storeJson', url, json]);
        };


        WorkerGameMain.prototype.postToMain = function(msg) {
            postMessage(msg);
        };

        return WorkerGameMain;

    });

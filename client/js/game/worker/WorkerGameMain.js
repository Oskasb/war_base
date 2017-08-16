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
                this[msg[0]](msg[0], msg[1])
            } else {
                console.log("No function", msg[0])
            }
            console.log("-- >Worker Game Message", msg)
        };

        WorkerGameMain.prototype.createTerrain = function(msgName, options) {
            console.log("opts:", options);
            var array = this.terrainFunctions.createTerrainArray1d(JSON.parse(options));
            this.postToMain([msgName, array]);
        };



        WorkerGameMain.prototype.registerProtocol = function(msgName, protocol) {



            var randomSend = function(prtc) {

                var channelCount = (prtc.length - 3) / 3;
                var channel = 2 + 3 * Math.floor(Math.random()*channelCount);


                prtc[channel+1] = Math.random();

                prtc[prtc.length-1] = 1000*Math.random()*0.01;

                if (self.SharedArrayBuffer_) {
                    prtc[channel+2][0] = prtc[channel+1];
                    prtc[channel+2][1] = 1000 * Math.random() * 0.01;
                } else {
                    this.postToMain([prtc[0], prtc[1], channel, prtc[channel+1], prtc[prtc.length-1]]);
                }

            }.bind(this);

            setInterval(function() {
                randomSend(protocol);
            },40);
        };

        WorkerGameMain.prototype.saveJsonData = function(json, url) {
            this.worker.postMessage(['storeJson', url, json]);
        };


        WorkerGameMain.prototype.postToMain = function(msg) {
            postMessage(msg);
        };

        return WorkerGameMain;

    });

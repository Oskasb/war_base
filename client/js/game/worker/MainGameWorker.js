var baseUrl = './../../../../';

var mainGameWorker;
var window = self;
var postMessage = self.postMessage;

importScripts(baseUrl+'client/js/ENUMS.js');
importScripts(baseUrl+'Transport/MATH.js');
importScripts(baseUrl+'client/js/lib/three/three.js');
importScripts(baseUrl+'client/js/lib/three/OBJLoader.js');
importScripts(baseUrl+'client/js/lib/ammo/ammo.wasm.js');
importScripts(baseUrl+'client/js/lib/cannon/cannon.js');
importScripts(baseUrl+'client/js/game/worker/terrain/ServerTerrain.js');
importScripts(baseUrl+'client/js/lib/require.js');



require.config({
	baseUrl: baseUrl,
	paths: {
        data_pipeline:'client/js/lib/data_pipeline/src',
        ThreeAPI:'client/js/3d/three/ThreeWorkerAPI',
        PipelineAPI:'client/js/io/PipelineAPI',
        PipelineObject:'client/js/PipelineObject',
        Events:'client/js/Events',
        EventList:'client/js/EventList',
		worker:'client/js/game/worker',
        three:'client/js/3d/three',
        "3d":'client/js/3d',
        game:'client/js/game'
	}
});

require(
	[
	    'worker/WorkerGameMain'
    ],
	function(
	    WorkerGameMain
    ) {

		var MainGameWorker = function(Ammo) {
			this.workerGameMain = new WorkerGameMain(Ammo);
		};


        Ammo().then(function(Ammo) {
            mainGameWorker = new MainGameWorker(Ammo);
            postMessage([1, 'ready']);
        });
	}
);

var handleMessage = function(oEvent) {
    mainGameWorker.workerGameMain.handleMessage(oEvent.data);
};

onmessage = function (oEvent) {
	handleMessage(oEvent);
};
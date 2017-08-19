var baseUrl = './../../../../';

var mainGameWorker;

importScripts(baseUrl+'Transport/MATH.js');
importScripts(baseUrl+'client/js/lib/three/three.js');
importScripts(baseUrl+'client/js/game/worker/terrain/ServerTerrain.js');
importScripts(baseUrl+'client/js/game/worker/physics/cannon.js');
importScripts(baseUrl+'client/js/lib/require.js');

require.config({
	baseUrl: baseUrl,
	paths: {
        data_pipeline:'client/js/lib/data_pipeline/src',
        PipelineAPI:'client/js/io/PipelineAPI',
        Events:'client/js/Events',
        EventList:'client/js/EventList',
		worker:'client/js/game/worker'
	}
});

require(
	[
	    'worker/WorkerGameMain'
    ],
	function(
	    WorkerGameMain
    ) {

		var MainGameWorker = function() {
			this.workerGameMain = new WorkerGameMain();
		};

        mainGameWorker = new MainGameWorker();
		postMessage(['ready']);
	}
);

var handleMessage = function(oEvent) {
    mainGameWorker.workerGameMain.handleMessage(oEvent.data);
};

onmessage = function (oEvent) {
	handleMessage(oEvent);
};
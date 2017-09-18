"use strict";

define([
		'Events',
        'GameAPI',
		'application/ClientRegistry',
        'application/debug/SetupDebug',
		'io/Connection',
		'application/TimeTracker',
		'modelviewer/ViewerMain',
        'ui/GuiSetup',
		'ui/UiMessenger',
		'PipelineAPI'
    ],
	function(
        evt,
        GameAPI,
        ClientRegistry,
        SetupDebug,
        Connection,
        TimeTracker,
        ViewerMain,
        GuiSetup,
        UiMessenger,
        PipelineAPI
    ) {


		var frame = 0;

		var name;

        var ClientState = '';
        var sendMessage = function() {};

        var ModelViewer = function(pointerCursor) {
            ClientState = ENUMS.ClientStates.INITIALIZING;

            new SetupDebug();

			this.pointerCursor = pointerCursor;

			this.timeTracker = new TimeTracker();
			this.viewerMain = new ViewerMain();

			this.gameMain = this.viewerMain;

			this.guiSetup = new GuiSetup();
            new UiMessenger();
            this.connection = new Connection();

            this.handlers = {};

            this.handlers.clientRegistry = new ClientRegistry();
            this.handlers.gameMain = this.viewerMain;
            this.handlers.timeTracker = this.timeTracker;
        //    this.handlers.clientWorld = new ClientWorld();

            PipelineAPI.setCategoryData(ENUMS.Category.POINTER_STATE, this.pointerCursor.inputState);

		};


        ModelViewer.prototype.setClientState = function(state) {
            ClientState = state;
    //        console.log("SetCLientState: ", state);
            evt.fire(evt.list().MESSAGE_UI, {channel:ENUMS.Channel.client_state, message:' - '+state});
        };


        ModelViewer.prototype.connectSocket = function(socketMessages, connection) {
            this.setClientState(ENUMS.ClientStates.CONNECTING);

            var disconnectedCallback = function() {
                console.log("Socket Disconnected");
                this.setClientState(ENUMS.ClientStates.DISCONNECTED);
                evt.fire(evt.list().MESSAGE_UI, {channel:'connection_error', message:'Connection Lost'});
                evt.fire(evt.list().CONNECTION_CLOSED, {data:'closed'});
                evt.removeListener(evt.list().SEND_SERVER_REQUEST, handleSendRequest);
                setTimeout(function() {
                    connect();
                }, 200)
            }.bind(this);

            var handleSendRequest = function(e) {
                var msg = socketMessages.getMessageById(evt.args(e).id);
                var args = evt.args(e);
                sendMessage(msg, args);
            };

            var errorCallback = function(error) {
                console.log("Socket Error", error);
            };

            var connectedCallback = function() {
                this.setClientState(ENUMS.ClientStates.CONNECTED);
                evt.fire(evt.list().MESSAGE_UI, {channel:'connection_status', message:'Connection Open'});
                evt.fire(evt.list().CONNECTION_OPEN, {});
                evt.on(evt.list().SEND_SERVER_REQUEST, handleSendRequest);
            }.bind(this);

            var connect = function() {
                sendMessage = connection.setupSocket(connectedCallback, errorCallback, disconnectedCallback);
            };

            connect();

        };


        ModelViewer.prototype.initiateClient = function(socketMessages, ready) {

            this.guiSetup.initMainGui();
            ready();

		};

        var aggDiff = 0;

        var tickEvent = {frame:0, tpf:1};


        ModelViewer.prototype.setupSimulation = function(sceneController, ready) {
            var _this = this;

    //        console.log("Setup Simulation");

            var clientTick = function(tpf) {
                _this.tick(tpf, sceneController)

            };

            var postrenderTick = function(tpf) {
                _this.tickPostrender(tpf, sceneController)

            };

            var systems = 0;

            var sysReady = function() {
                systems++;
                if (systems === 1) {
                    ready();
                }

                if (systems === 2) {
                    this.ready = true;
                }

            }.bind(this);

            sceneController.setup3dScene(clientTick, postrenderTick, sysReady);
            sceneController.setupEffectPlayers(sysReady);

        //    evt.once(evt.list().PLAYER_READY, sysReady);

        };


        var start;
        var gameTime = 0;

        ModelViewer.prototype.tickPostrender = function(tpf) {

            PipelineAPI.setCategoryKeyValue('STATUS', 'TPF', tpf);

            evt.fire(evt.list().CLIENT_TICK, tickEvent);
        };

        var tickTimeout;

        ModelViewer.prototype.tick = function(tpf, sceneController) {

            if (!this.ready) return;

            gameTime += tpf;
            start = performance.now();
            
			frame++;

        //    var responseStack = this.connection.processTick();

        //    this.processResponseStack(responseStack);

			var exactTpf = this.timeTracker.trackFrameTime(frame);

            if (exactTpf < 0.002) {
        //        console.log("superTiny TPF");
                return;
            }

		//	console.log(tpf - exactTpf, tpf, this.timeTracker.tpf);

            aggDiff += tpf-exactTpf;

            GameAPI.tickControls(tpf, gameTime);

            this.pointerCursor.tick();

            GameAPI.tickPlayerPiece(tpf, gameTime);

            sceneController.tickEffectPlayers(tpf);

            clearTimeout(tickTimeout);
            tickTimeout = setTimeout(function() {

                tickEvent.frame = frame;
                tickEvent.tpf = tpf;

                GameAPI.tickGame(tpf, gameTime);

            }, 0);



            this.viewerMain.tickViewerClient(tpf);
            
        //    evt.fire(evt.list().CAMERA_TICK, {frame:frame, tpf:tpf});

            PipelineAPI.setCategoryKeyValue('STATUS', 'TIME_GAME_TICK', performance.now() - start);


            if (PipelineAPI.getPipelineOptions('jsonPipe').polling.enabled) {
                PipelineAPI.tickPipelineAPI(tpf);
            }
            
		};

		return ModelViewer;

	});
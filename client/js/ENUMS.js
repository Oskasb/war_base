
if(typeof(ENUMS) === "undefined"){
    ENUMS = {};
}

(function(ENUMS){

    ENUMS.ClientStates = {
        INITIALIZING:'INITIALIZING',
        DISCONNECTED:'DISCONNECTED',
        CONNECTING:'CONNECTING',
        CONNECTED:'CONNECTED',
        LOADING:'LOADING',
        READY:'READY',
        PLAYING:'PLAYING',
        CLIENT_REQUESTED:'CLIENT_REQUESTED',
        CLIENT_REGISTERED:'CLIENT_REGISTERED',
        PLAYER_REQUESTED:'PLAYER_REQUESTED'
    };

    ENUMS.PieceStates = {
        TIME_OUT:'TIME_OUT',
        MOVING:'MOVING',
        STATIC:'STATIC',
        TELEPORT:'TELEPORT',
        SPAWN:'SPAWN',
        KILLED:'KILLED',
        BURST:'BURST',
        EXPLODE:'EXPLODE',
        REMOVED:'REMOVED',
        APPEAR:'APPEAR',
        HIDE:'HIDE'
    };

    ENUMS.Category = {
        POINTER_STATE:'POINTER_STATE',
        STATUS:'STATUS',
        LOAD_MODEL:'LOAD_MODEL',
        LOAD_MODULE:'LOAD_MODULE',
        LOAD_ENVIRONMENT:'LOAD_ENVIRONMENT',
        LOAD_PARTICLES:'LOAD_PARTICLES',
        GUI_ELEMENT:'GUI_ELEMENT',
        setup:'setup'
    };

    ENUMS.Key = {
        MON_VEGETATION:'MON_VEGETATION',
        DEBUG:'DEBUG',
        FULL_SCREEN:'FULL_SCREEN',
        MODEL_LOADER:'MODEL_LOADER',
        MODULE_LOADER:'MODULE_LOADER',
        PARTICLE_LOADER:'PARTICLE_LOADER',
        ENV_LOADER:'ENV_LOADER',
        ADD:'ADD',
        REMOVE:'REMOVE'
    };

    ENUMS.Channel = {
        client_state:'client_state'
    };

    ENUMS.Gui = {
        rightPanel:'rightPanel',
        leftPanel:'leftPanel'
    };

    ENUMS.Type = {
        toggle:'toggle'
    }

    ENUMS.ModuleParams = {
        attachment_points:'attachment_points',
        channels:'channels'
    };


})(ENUMS);


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

    ENUMS.CombatStates = {
        NONE:0,
        IDLE:1,
        ENGAGING:2,
        ENGAGED:3,
        DISENGAGING:4,
        DISENGAGED:5,
        DISABLED:6,
        DESTROYED:7,
        KILLED:8
    };

    ENUMS.Category = {
        POINTER_STATE:'POINTER_STATE',
        STATUS:'STATUS',
        LOAD_MODEL:'LOAD_MODEL',
        LOAD_MODULE:'LOAD_MODULE',
        LOAD_TERRAIN:'LOAD_TERRAIN',
        LOAD_CAMERA:'LOAD_CAMERA',
        LOAD_CONTROLS:'LOAD_CONTROLS',
        LOAD_PIECE:'LOAD_PIECE',
        LOAD_ACTOR:'LOAD_ACTOR',
        LOAD_ENVIRONMENT:'LOAD_ENVIRONMENT',
        LOAD_PARTICLES:'LOAD_PARTICLES',
        LOAD_LEVEL:'LOAD_LEVEL',
        LOAD_APP:'LOAD_APP',
        GUI_ELEMENT:'GUI_ELEMENT',
        setup:'setup'
    };

    ENUMS.Key = {
        MON_VEGETATION:'MON_VEGETATION',
        DEBUG:'DEBUG',
        FULL_SCREEN:'FULL_SCREEN',
        MODEL_LOADER:'MODEL_LOADER',
        TERRAIN_LOADER:'TERRAIN_LOADER',
        MODULE_LOADER:'MODULE_LOADER',
        PIECE_LOADER:'PIECE_LOADER',
        CONTROL_LOADER:'CONTROL_LOADER',
        CAMERA_LOADER:'CAMERA_LOADER',
        ACTOR_LOADER:'ACTOR_LOADER',
        LEVEL_LOADER:'LEVEL_LOADER',
        APP_LOADER:'APP_LOADER',
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

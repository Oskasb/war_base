"use strict";

define([
        'PipelineAPI',
        'ThreeAPI',
        'game/GameActor',
        'game/levels/GameLevel'
    ],

    function(
        PipelineAPI,
        ThreeAPI,
        GameActor,
        GameLevel
    ) {


        var GameAPI;

        var LevelBuilder = function(gameApi) {
            GameAPI = gameApi
        };

        LevelBuilder.prototype.createLevel = function(res, onOk) {

            var levelReady = function(level) {

                var createIt = function(mod, actor, buffers) {

                    var model = ThreeAPI.loadGround(mod.config.options, buffers, ThreeAPI.createRootObject());
                    mod.setModel(model);
                    level.addLevelTerrainActor(actor);
                    onOk(level);
                };

                var ready = function(actor) {

                    GameAPI.addActor(actor);
                    var piece = actor.piece;

                    var onAttachRes = function(res) {

                        var idMap = JSON.parse(res[0]);
                        var buffers = res[1];

                        for (var i = 0; i < piece.pieceSlots.length; i++) {
                            var mod = piece.pieceSlots[i].module;

                            mod.visualModule.addModuleDebugBox();

                            if (mod.config.terrain) {
                                createIt(mod, actor, buffers);
                            }
                        }
                    };

                    GameAPI.attachTerrainToLevel(actor, level, onAttachRes);
                    ThreeAPI.addToScene(actor.piece.rootObj3D);
                };

                GameAPI.createActor({dataKey:level.config.actor}, ready);
            };

            new GameLevel(res.levelId, res.dataKey, levelReady);
        };


        LevelBuilder.prototype.removeLevelTerrainActors = function(level) {

            var onRemove = function(actorId) {
                console.log("Removed level TerrainActor", actorId);
            };

            for (var i = 0; i < level.terrains.length; i++) {
                var terrainActor = level.terrains[i];
                ThreeAPI.removeTerrainByPosition(terrainActor.piece.rootObj3D.position);
                GameAPI.removeActor(terrainActor, onRemove);
            }
        };



        return LevelBuilder;
    });


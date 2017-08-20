"use strict";

define([
        'PipelineAPI',
        'ThreeAPI',
        'game/GameActor',
        'game/GameLevel'
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
                        //    model.children[0].position.x -= mod.config.options.terrain_size / 2;
                        //    model.children[0].position.z -= mod.config.options.terrain_size / 2;
                            mod.setModel(model);
                            level.setLevelActor(actor);
                            onOk(level);
                    };

                    var ready = function(actor) {

                        GameAPI.addActor(actor);

                        var piece = actor.piece;

                        var onAttachRes = function(res) {

                            var idMap = JSON.parse(res[0]);
                            var buffers = res[1];

                         //   console.log("LevelActor Res:", res)

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
                    //    ThreeAPI.addToScene(actor.controls.rootObj3D);

                        //    rootModels[id].push(actor);
                        //    _this.monitorPieceModules(actor.piece, true);
                    };

                    GameAPI.createActor({dataKey:level.config.actor}, ready);

                };

                new GameLevel(res.levelId, res.dataKey, levelReady);

        };

        return LevelBuilder;
    });


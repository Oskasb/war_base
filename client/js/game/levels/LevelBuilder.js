"use strict";

define([
        'PipelineAPI',
        'ThreeAPI',
        'EffectsAPI',
        'game/GameActor',
        'game/levels/GameLevel'
    ],

    function(
        PipelineAPI,
        ThreeAPI,
        EffectsAPI,
        GameActor,
        GameLevel
    ) {

        var GameAPI;

        var LevelBuilder = function(gameApi) {
            GameAPI = gameApi
        };

        LevelBuilder.prototype.createLevel = function(res, onLevelActorReady) {

            var levelReady = function(level) {

                var actorReady = function(actor) {
                    onLevelActorReady(level, actor);
                };

                GameAPI.createActor({dataKey:level.config.actor}, actorReady);
            };

            new GameLevel(res.levelId, res.dataKey, levelReady);
        };

        LevelBuilder.prototype.createLevelTerrainActor = function(level, actor, buffers, onOk) {

            var delayedOk = function(call, l) {
                setTimeout(function() {
                    actor.piece.setRenderable(true);
                    actor.piece.setStatesDirty();
                    call(l)
                }, 500)
            };

            var createIt = function(mod, actor, buffers) {
                var model = ThreeAPI.loadGround(mod.config.options, buffers, ThreeAPI.createRootObject());
                mod.setModel(model);

                mod.visualModule.showVisualModule(true);

                level.addLevelTerrainActor(actor);
                EffectsAPI.enableTerrainVegetation();
                delayedOk(onOk, level);
            };

            var piece = actor.piece;

                for (var i = 0; i < piece.pieceSlots.length; i++) {
                    var mod = piece.pieceSlots[i].module;

                //    mod.visualModule.addModuleDebugBox();



                    if (mod.config.terrain) {
                        createIt(mod, actor, buffers);
                    }
                }


        };

        LevelBuilder.prototype.removeLevelTerrainActors = function(level) {

            var onRemove = function(actorId) {
                console.log("Removed level TerrainActor", actorId);
            };

            for (var i = 0; i < level.terrainActors.length; i++) {
                var terrainActor = level.terrainActors[i];
                EffectsAPI.disableTerrainVegetation();
                ThreeAPI.removeTerrainByPosition(terrainActor.piece.rootObj3D.position);
            //    terrainActor.piece.removeGamePiece();
                GameAPI.removeActor(terrainActor, onRemove);
            }
        };


        LevelBuilder.prototype.populateLevel = function(level, onRes) {

            var adds = 0;

            var actorRes = function(actor) {
                adds--;


                if (adds === 0){
                    onRes(level);
                }
            };

            var addPopulationActor = function(actorConfig,population) {
                adds++;
                var actorMade = function(actor) {
                    population.registerPopulationActor(actor);
                    actorRes(actor);
                };

                GameAPI.createActor(actorConfig, actorMade);
            };


            var dataReady = function(population) {

                var actorsConfig = population.getPoplationActorConfig();
                for (var i = 0; i < actorsConfig.length; i++) {
                    var count = actorsConfig[i].count;

                    for (var j = 0; j < count; j++) {
                        addPopulationActor(actorsConfig[i].options,population)
                    }
                    adds++;
                    actorRes(null);
                }
            };

            var populate = function(lvl) {
                lvl.createLevelPopulations(dataReady);
            };

            this.dePopulateLevel(level, populate);

        };


        LevelBuilder.prototype.dePopulateLevel = function(lvl, onDepopulated) {

            var depopulate = function(level, onOk) {
                var populations = level.getLevelPopulations();
                var removeCount = 0;

                var onRemove = function() {
                    removeCount--;
                    if (removeCount === 0) {
                        onOk(level);
                    }
                };

                while (populations.length) {
                    var population =  populations.pop();
                    var idList = population.populationIds;

                    population.removeLevelPopulation();

                    while (idList.length) {
                        removeCount++;
                        var actor = GameAPI.getActorById(idList.pop());
                        GameAPI.removeActor(actor, onRemove)
                    }
                }

                removeCount++;
                onRemove();
            };

            depopulate(lvl, onDepopulated);

        };


        return LevelBuilder;
    });


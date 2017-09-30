"use strict";

define([
        'PipelineAPI',
        'worker/simulation/SimulationOperations',
        'ThreeAPI'

    ],
    function(
        PipelineAPI,
        SimulationOperations,
        ThreeAPI
    ) {

        var actors;
        var levels = [];

        var physicsApi;

        var calcVec = new THREE.Vector3();
        var calcVec2 = new THREE.Vector3();
        var calcVec3 = new THREE.Vector3();

        var SimulationUtils = function(simulationState, physApi) {
            this.requestedEntries = 0;
            this.simulationState = simulationState;
            physicsApi = physApi;
            this.terrainFunctions = simulationState.terrainFunctions;
            this.simulationOperations = simulationState.simulationOperations;

            actors = simulationState.getActors();
            levels = simulationState.getLevels();
        };

        SimulationUtils.prototype.initSimulationLevel = function(options, ready) {

            physicsApi.initPhysics();

            ThreeAPI.initThreeScene();

            var levelBuilt = function(level) {
                levels.push(level);
                ready({dataKey:level.dataKey, levelId:level.id, config:level.config});
            }.bind(this);

            this.simulationOperations.buildLevel(options, levelBuilt);

        };


        SimulationUtils.prototype.simulationSelectionActivatedActorId = function(actorId, onOk) {
            var actor;
            if (this.simulationState.selectionActivatedActorId !== actorId) {
                actor = this.simulationState.getActorById(this.simulationState.selectionActivatedActorId);

                if (!actor) {
                } else {
                    actor.piece.getCombatStatus().notifyActivationDeactivate();
                }
            }

            this.simulationState.selectionActivatedActorId = actorId;

            if (actorId) {
                actor = this.simulationState.getActorById(actorId);

                if (!actor) {
                    console.log("Cant select missing actor!");
                } else {
                    actor.piece.getCombatStatus().notifySelectedActivation();
                }
            }

            onOk(actorId);
        };


        SimulationUtils.prototype.activateSimulationActor = function(actor) {

            ThreeAPI.addToScene(actor.piece.rootObj3D);

            if (actor.body) {
                physicsApi.includeBody(actor.body);
                physicsApi.triggerPhysicallyActive(actor)
            }

            actor.setActivationState(ENUMS.PieceActivationStates.HIDDEN);

            if (actors.indexOf(actor) === -1) {
                actors.push(actor);
            }

            var res = {dataKey:actor.dataKey, actorId:actor.id};
            postMessage(['executeDeployActor', res]);

        };

        var buildIt = function(actor, px, py, pz, nx, ny, nz, rotY, cb, simState) {


            var elevation = 0;
            var normalFactor = 3.14;
            actor.piece.rootObj3D.quaternion.set(0, 0, 0, 1);

            if (actor.physicalPiece) {
                var groungInf = actor.physicalPiece.config.ground_influence;
                if (groungInf) {
                    elevation = groungInf.elevation;
                    normalFactor *= groungInf.normal_factor;

                    if (groungInf.rotate_y) {
                        actor.piece.rootObj3D.rotateY(groungInf.rotate_y[0]*Math.PI +  Math.PI * Math.random() * (groungInf.rotate_y[1] - groungInf.rotate_y[0]));
                    } else {
                        if (rotY !== 'undefined') {
                          actor.piece.rootObj3D.rotateY(rotY * Math.PI);
                            //     actor.piece.rootObj3D.quaternion.y = rotY;
                        //    actor.piece.rootObj3D.quaternion.normalize();
                        }
                    }
                }
            }

            actor.piece.getPos().set(px, py+elevation, pz);

            calcVec.set(nx, ny, nz);

            actor.piece.rootObj3D.rotateX(calcVec.z * normalFactor);
            actor.piece.rootObj3D.rotateZ(-calcVec.x * normalFactor);


            simState.attachActorRigidBody(actor);
            cb(actor);


        };

        var attachCompanions = function(actor, px, py, pz, nx, ny, nz, rotY, respond, simulationState, companion_actors, index) {
            var companionActors = companion_actors;

            if (companionActors) {

                var i = index;
                if (i === companionActors.length) {
                    return;
                }

                var companionBuilt = function(companionActor) {

                    var offset = companionActors[i].offset;

                    i++;

                    companionActor.setIsCompanion( true);

                    buildIt(companionActor, px+offset[0], py+offset[1], pz+offset[2], nx, ny, nz, rotY, respond, simulationState);
                    attachCompanions(companionActor, px+offset[0], py+offset[1], pz+offset[2], nx, ny, nz, rotY, respond, simulationState, companionActor.config.companion_actors, i);
                };

                simulationState.simulationOperations.buildActor({dataKey:companionActors[i].dataKey}, companionBuilt);
            }
        };

        SimulationUtils.prototype.generateSimulationActor = function(actorId, pos, normal, facing, onOk) {

            var px = pos.x;
            var py = pos.y;
            var pz = pos.z;
            var nx = normal.x;
            var ny = normal.y;
            var nz = normal.z;

            var rotY = facing || 0;

            var respond = onOk;
            var _this = this;


            var actorBuilt = function(actor) {
                var comps =  actor.config.companion_actors;
                if (comps) {
                    for (var i = 0; i < comps.length; i++) {
                        attachCompanions(actor, px, py, pz, nx, ny, nz, rotY, respond, _this, actor.config.companion_actors, i);
                    }
                }

                actor.setIsCompanion(false);
                buildIt(actor, px, py, pz, nx, ny, nz, rotY, respond, _this.simulationState)
            };

            this.simulationOperations.buildActor({dataKey:actorId}, actorBuilt);

        };


        SimulationUtils.prototype.spawnSimulationActor = function(options, ready) {

            var actorBuilt = function(actor) {
                this.simulationOperations.getRandomPointOnTerrain(actor.piece.rootObj3D.position, levels);

                if (actors.indexOf(actor) !== -1) {
                    console.log("Double add actor fail");
                } else {
                    this.simulationState.attachActorRigidBody(actor);
                    //    physicsApi.triggerPhysicallyActive(actor)
                }

                ThreeAPI.addToScene(actor.piece.rootObj3D);

                if (actor.body) {
                    physicsApi.includeBody(actor.body);
                }

                actor.setActivationState(ENUMS.PieceActivationStates.VISIBLE);

                if (actors.indexOf(actor) === -1) {
                    actors.push(actor);
                }

                ready({dataKey:actor.dataKey, actorId:actor.id});
            }.bind(this);

            this.simulationOperations.buildActor(options, actorBuilt);
        };


        SimulationUtils.prototype.deactivateSimulationActorId = function(actorId, cb) {

            var actor = this.simulationState.getActorById(actorId);

            if (actorId === this.simulationState.controlledActorId) {
                this.simulationState.controlledActorId = null;
            }

            if (actor.body) {
                physicsApi.disableActorPhysics(actor);
            }

            var combatStatus = actor.piece.getCombatStatus();
            if (combatStatus) {
            //    combatStatus.notifyCancelCombat();
            }


            actor.setActivationState(ENUMS.PieceActivationStates.INACTIVE);
            this.simulationState.updateActorFrame(actor, 0.1);
            ThreeAPI.removeFromScene(actor.piece.rootObj3D);

            this.simulationState.detatchActor(actor);


            if (typeof(cb) === 'function') {
                cb(actorId);
            }

        };


        var checkSlope = function(normal, min, max) {
            return min < 1 - normal.y && max >= 1 - normal.y
        };

        var checkElevation = function(pos, min, max) {
            return min < pos.y && max >= pos.y
        };


        SimulationUtils.prototype.spawnStaticActor = function(pos, facing, spawnConf) {

            console.log("Spawn StaticActor: ", facing, spawnConf);


            var entryId = spawnConf.id;


            var onOk = function(actor) {
                this.requestedEntries--;
                this.simulationState.activateActor(actor);
                actor.setActivationState(ENUMS.PieceActivationStates.HIDDEN);
                console.log("Generated Spawned Static actor", actor, this.requestedEntries);
            }.bind(this);

            calcVec.copy(pos);

            calcVec.y = this.simulationState.getTerrainHeightAtPos(calcVec, calcVec3);

            if (spawnConf.probability) {
                if (Math.random() > spawnConf.probability) {
                    return;
                }
            }

            if (spawnConf.elevation) {
                var slopeOk = checkSlope(calcVec3, spawnConf.slope.min, spawnConf.slope.max);

                if (!slopeOk) {
                    return;
                }
            }

            if (spawnConf.elevation) {

                var elevationOk = checkElevation(calcVec, spawnConf.elevation.min, spawnConf.elevation.max);

                if (!elevationOk) {
                    return;
                }
            }


            this.requestedEntries++;

            if (isNaN(calcVec.x) || isNaN(calcVec.y) || isNaN(calcVec.z) || isNaN(calcVec3.x)|| isNaN(calcVec3.y) || isNaN(calcVec3.z) || isNaN(facing)) {
                console.log("Bad spatial vectors", calcVec, calcVec3, facing);
                return;
            }

            this.simulationState.generateActor(entryId, calcVec, calcVec3, facing, onOk);


        };

        SimulationUtils.prototype.activateStaticSector = function(staticSector) {

            var spawnCallback = function(pos, facing, spawnConf) {
                this.spawnStaticActor(pos, facing, spawnConf);
            }.bind(this);

            staticSector.activateSectorPopulation(spawnCallback)
        };

        SimulationUtils.prototype.populateActiveLevel = function(level) {

            var sectorReady = function(sector) {
                this.activateStaticSector(sector);
            }.bind(this);

            level.updateStaticDimensions();
            level.generateStaticSectors(sectorReady);


        };

        SimulationUtils.prototype.attachSimulationTerrainActorToLevel = function(levelId, actorId, cb) {
            var level = this.simulationState.getLevelById(levelId);
            var actor = this.simulationState.getActorById(actorId);

            if (actor && level) {
                level.addLevelTerrainActor(actor);
            } else {
                cb({levelActorError:{actorId:actorId, levelId:levelId}});
                console.log("Fail connectinr actor to level", actorId, levelId);
            };

            var terrainOpts = this.simulationOperations.getActorTerrainOptions(actor);

            console.log("OPTS", terrainOpts);

            var terrain = this.terrainFunctions.createTerrain(terrainOpts);

            level.addTerrainToLevel(terrain);

            var buffers = this.terrainFunctions.getTerrainBuffers(terrain);

            terrain.array1d = buffers[4];
            var terrainBody = this.terrainFunctions.addTerrainToPhysics(terrainOpts, terrain.array1d, 0, 0);

            physicsApi.includeBody(terrainBody);
            actor.setPhysicsBody(terrainBody);

            //    time += 0.04;
            //    physicsApi.updatePhysicsSimulation(time);

                this.simulationState.updateActiveActor(actor, 1);

            this.simulationState.activityFilter.notifyActorActiveState(actor, true);

            this.populateActiveLevel(level);

            cb([JSON.stringify({actorId:actorId, levelId:levelId}), buffers]);
        };

        SimulationUtils.prototype.registerSimulationAttackHit = function(targetActor, attack, normal) {
            this.simulationState.removeActiveAttack(attack);
            if (!targetActor) {
                console.log("No target actor for hit");
                targetActor = {};
                targetActor.id = 'unknown'
                // return;
            }
            attack.registerAttackHit(targetActor.id, normal);
            attack.generateAttackHitMessage();

            attack.applyHitDamageToTargetActor(targetActor, 1);



            var aoeRange = attack.getAreaEffectRange();

            if (aoeRange) {
                var aoeDmgFactor = attack.getAreaEffectDamageFactor();

                for (var i = 0; i < actors.length; i++) {

                    var splashHitActor = this.simulationState.checkActorInRangeFromPosition(actors[i], aoeRange, attack.getImpactPoint());
                    if (splashHitActor) {

                        if (actors[i].piece.getCombatStatus()) {
                            attack.applyHitDamageToTargetActor(splashHitActor, aoeDmgFactor);
                        }

                        this.simulationState.applyForceToSimulationActor(attack.getAreaDamageForce(splashHitActor), splashHitActor, 0.3);
                        this.simulationState.activityFilter.notifyActorActiveState(splashHitActor, true);
                    }
                }
            } else {
                this.simulationState.applyForceToSimulationActor(attack.getImpactForce(), targetActor, 0.5);
            }

            this.simulationState.activityFilter.notifyActorActiveState(targetActor, true);
        };


        return SimulationUtils;

    });


"use strict";

define([
        'PipelineAPI',
        'worker/simulation/SimulationOperations',
        'ThreeAPI',
        'worker/physics/AmmoAPI',
        'worker/terrain/TerrainFunctions'

    ],
    function(
        PipelineAPI,
        SimulationOperations,
        ThreeAPI,
        AmmoAPI,
        TerrainFunctions
    ) {

        var actors = [];
        var levels = [];
        var attacks = [];
        var time = 0;

        var physicsApi;

        var calcVec = new THREE.Vector3();

        var SimulationState = function(Ammo, protocolSystem) {
            this.protocolSystem = protocolSystem;
            this.controlledActorId = null;

            physicsApi = new AmmoAPI(Ammo);
            this.terrainFunctions = new TerrainFunctions(physicsApi);
            this.simulationOperations = new SimulationOperations(this.terrainFunctions);

            ThreeAPI.initThreeScene();
        };

        SimulationState.prototype.addLevel = function(options, ready) {

            physicsApi.initPhysics();

            ThreeAPI.initThreeScene();

            var levelBuilt = function(level) {
                levels.push(level);
                ready({dataKey:level.dataKey, levelId:level.id, config:level.config});
            }.bind(this);

            //
            this.simulationOperations.buildLevel(options, levelBuilt);
            //

        };


        SimulationState.prototype.registerActiveAttack = function(attack) {
            attacks.push(attack);
        };

        SimulationState.prototype.removeActiveAttack = function(attack) {
            attack.returnToPool();
            attacks.splice(attacks.indexOf(attack), 1);

        };


        SimulationState.prototype.includeActor = function(actor) {
            physicsApi.setupPhysicalActor(actor);

            ThreeAPI.addToScene(actor.piece.rootObj3D);

            if (actor.body) {
                physicsApi.includeBody(actor.body);
            }
            actors.push(actor);
        };

        var buildIt = function(actor, px, py, pz, nx, ny, nz, cb, simState) {
            var res = {dataKey:actor.dataKey, actorId:actor.id};

            var elevation = 0;
            var normalFactor = 1;

            if (actor.physicalPiece) {
                var groungInf = actor.physicalPiece.config.ground_influemce;
                if (groungInf) {
                    elevation = groungInf.elevation || 0;
                    normalFactor = groungInf.normal_factor || 1;
                }
            }

            actor.piece.getPos().set(px, py+elevation, pz);

            actor.piece.rootObj3D.quaternion.set(0, 0, 0, 1);

        //    calcVec.set(nx, ny, nz);

        //    actor.piece.rootObj3D.quaternion.setFromAxisAngle(calcVec, 1);
            actor.piece.rootObj3D.rotateX(calcVec.x * normalFactor);
            actor.piece.rootObj3D.rotateZ(calcVec.z * normalFactor);
            simState.includeActor(actor);
            cb(res);

            postMessage(['executeDeployActor', res]);
        };

        var attachCompanions = function(actor, px, py, pz, nx, ny, nz, respond, _this, companion_actors, index) {
            var companionActors = companion_actors;

            if (companionActors) {

                var i = index;
                if (i === companionActors.length) {
                    return;
                }

                var companionBuilt = function(companionActor) {

                    var offset = companionActors[i].offset;

                    i++;

                    buildIt(companionActor, px+offset[0], py+offset[1], pz+offset[2], nx, ny, nz, respond, _this);
                    attachCompanions(companionActor, px+offset[0], py+offset[1], pz+offset[2], nx, ny, nz, respond, _this, companionActor.config.companion_actors, i);
                };

                _this.simulationOperations.buildActor({dataKey:companionActors[i].dataKey}, companionBuilt);
            }
        };

        SimulationState.prototype.generateActor = function(actorId, pos, normal, onOk) {

            var px = pos.x;
            var py = pos.y;
            var pz = pos.z;
            var nx = normal.x;
            var ny = normal.y;
            var nz = normal.z;

            var respond = onOk;
            var _this = this;


            var actorBuilt = function(actor) {
                var comps =  actor.config.companion_actors;
                if (comps) {
                    for (var i = 0; i < comps.length; i++) {
                        attachCompanions(actor, px, py, pz, nx, ny, nz, respond, _this, actor.config.companion_actors, i);
                    }
                }

                buildIt(actor, px, py, pz, nx, ny, nz, respond, _this)
            };

            this.simulationOperations.buildActor({dataKey:actorId}, actorBuilt);

        };

        SimulationState.prototype.getGridSystemIdAtPos = function(pos) {
            return "basic_grassland";
        };

        SimulationState.prototype.despawnActor = function(actorId) {

            var onOk = function(aId) {
                postMessage(['executeRemoveActor', aId]);
            };

            this.removeActor(actorId, onOk);
        };

        SimulationState.prototype.spawnActor = function(options, ready) {

            var actorBuilt = function(actor) {
                this.simulationOperations.getRandomPointOnTerrain(actor.piece.rootObj3D.position, levels);
                this.includeActor(actor);
                ready({dataKey:actor.dataKey, actorId:actor.id});
            }.bind(this);

            this.simulationOperations.buildActor(options, actorBuilt);
        };

        SimulationState.prototype.setControlledActorId = function(actorId, onOk) {
            this.controlledActorId = actorId;
            onOk(actorId);
        };

        SimulationState.prototype.getControlledActor = function() {
            return this.getActorById(this.controlledActorId)
        };

        SimulationState.prototype.getActors = function() {
            return actors;
        };

        SimulationState.prototype.getActorById = function(actorId) {
            for (var i = 0; i < actors.length; i++) {
                if (actors[i].id == actorId) {
                    return actors[i];
                }
            }
            //    console.log("No actor by id:", actorId, actors);
        };

        SimulationState.prototype.getLevelById = function(leveId) {
            for (var i = 0; i < levels.length; i++) {
                if (levels[i].id === leveId) {
                    return levels[i];
                }
            }
            console.log("No level by id:", leveId, actors);
        };

        SimulationState.prototype.removeActor = function(actorId, cb) {
            var actor = this.getActorById(actorId);

            if (actorId === this.controlledActorId) {
                this.controlledActorId = null;
            }

            actors.splice(actors.indexOf(actor), 1);

            this.protocolSystem.removeProtocol(actor);
            if (actor.body) {
                physicsApi.disableActorPhysics(actor);
            }

            actor.piece.removeGamePiece();
            actor.removeGameActor();
            ThreeAPI.removeFromScene(actor.piece.rootObj3D);

            cb(actorId);
        };



        SimulationState.prototype.removeLevel = function(levelId, cb) {

            var level = this.getLevelById(levelId);
            levels.splice(levels.indexOf(level), 1);

            cb(levelId);
        };

        SimulationState.prototype.getTerrainHeightAtPos = function(posVec3, tempVec3) {
            return this.simulationOperations.getHeightAtPos(posVec3, levels, tempVec3);
        };

        SimulationState.prototype.cleanupSimulationState = function(cb) {
            physicsApi.cleanupPhysics(cb);
        };

        SimulationState.prototype.attachTerrainActorToLevel = function(levelId, actorId, cb) {
            var level = this.getLevelById(levelId);
            var actor = this.getActorById(actorId);

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

            //    this.updateActorFrame(actor, 0.02);

            cb([JSON.stringify({actorId:actorId, levelId:levelId}), buffers]);
        };


        SimulationState.prototype.registerAttackHit = function(targetActor, attack, pos, normal) {
            this.removeActiveAttack(attack);
            if (!targetActor) {
                console.log("No target actor for hit");
                targetActor = {};
                targetActor.id = 'unknown'
                //return;
            }
            postMessage(['executeAttackHit', [targetActor.id, pos.x, pos.y, pos.z, normal.x, normal.y, normal.z, attack.weaponOptions.on_hit_damage, attack.weaponOptions.on_hit_module_effect_id]]);
        };

        SimulationState.prototype.updateAttackFrame = function(attack, tpf) {

            var steps = 20;
            var stepTime = tpf / steps;


        //    var hit = this.simulationOperations.castPhysicsRay(this, physicsApi, attack, tpf);

            if (hit) {
                return;
            }

            for (var i = 0; i < steps; i++) {
                if (attack.duration + stepTime + tpf < 0) {
                    this.removeActiveAttack(attack);
                    return;
                } else {
                    attack.applyFrame(stepTime);

                     var hit = this.simulationOperations.checkActorProximity(this, this.getActors(), attack);

                     if (hit) {
                         i = steps;
                         return;
                     }

                    attack.advanceFrame(stepTime, physicsApi.getYGravity());
                }
            }

        };


        SimulationState.prototype.updateActorFrame = function(actor, tpf) {
            this.protocolSystem.applyProtocolToActorState(actor, tpf);
            actor.piece.updateGamePiece(tpf, time, this);
            actor.samplePhysicsState();
            this.protocolSystem.updateActorSendProtocol(actor, tpf);
        };


        SimulationState.prototype.updateState = function(tpf) {

            ThreeAPI.getScene().updateMatrixWorld();

            if (levels.length) {
                time += tpf;
                physicsApi.updatePhysicsSimulation(time);


                for (var i = 0; i < attacks.length; i++) {
                    this.updateAttackFrame(attacks[i], tpf);
                }

                for ( i = 0; i < actors.length; i++) {

                    actors[i].piece.rootObj3D.updateMatrixWorld();

                    this.updateActorFrame(actors[i], tpf);

                    var integrity = this.simulationOperations.checkActorIntegrity(actors[i], levels);

                    if (!integrity) {
                        //        this.simulationOperations.positionActorOnTerrain(actors[i], levels);
                    }
                }
            }

            var status = physicsApi.fetchPhysicsStatus();
        };

        return SimulationState;

    });


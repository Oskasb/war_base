"use strict";

define([
        'PipelineAPI',
        'worker/simulation/SimulationOperations',
        'worker/simulation/AggroProcessor',
        'ThreeAPI',
        'worker/simulation/ActivityFilter',
        'worker/simulation/SimulationMonitor'

    ],
    function(
        PipelineAPI,
        SimulationOperations,
        AggroProcessor,
        ThreeAPI,
        ActivityFilter,
        SimulationMonitor
    ) {

        var actors;
        var levels = [];

        var physicsApi;

        var calcVec = new THREE.Vector3();

        var SimulationProcessor = function(simulationState, physApi) {

            this.simulationState = simulationState;
            this.protocolSystem = simulationState.protocolSystem;
            physicsApi = physApi;
            this.terrainFunctions = simulationState.terrainFunctions;
            this.simulationOperations = simulationState.simulationOperations;

            this.activityFilter = simulationState.activityFilter;

            actors = simulationState.getActors();
            levels = simulationState.getLevels();
        };

        SimulationProcessor.prototype.processAttackFrame = function(attack, tpf) {

            var steps = 20;
            var stepTime = tpf / steps;


            for (var i = 0; i < steps; i++) {
                if (attack.duration + stepTime + tpf < 0) {
                    this.simulationState.removeActiveAttack(attack);
                    return;
                } else {
                    attack.applyFrame(stepTime);

                    var hit = this.simulationOperations.checkActorProximity(this.simulationState, actors, attack);

                    if (hit) {
                        i = steps;
                        return;
                    }

                    attack.advanceFrame(stepTime, physicsApi.getYGravity());
                }
            }

        };

        SimulationProcessor.prototype.processActiveActorFrame = function(actor, tpf) {

            actor.piece.rootObj3D.updateMatrixWorld();

            actor.piece.updatePieceStates(tpf);
            actor.piece.updatePieceSlots(tpf, this.simulationState);
            //     actor.piece.updatePieceVisuals(tpf);


            //    actor.piece.updateGamePiece(tpf, time, this);
            actor.samplePhysicsState();
            this.protocolSystem.updateActorSendProtocol(actor, tpf);

            var integrity = this.simulationOperations.checkActorIntegrity(actor, levels);

            if (!integrity) {
                //        this.simulationOperations.positionActorOnTerrain(actors[i], levels);
            }

        };

        SimulationProcessor.prototype.processStaticActorFrame = function(actor, tpf) {

            actor.piece.setPieceActivationState(ENUMS.PieceActivationStates.VISIBLE);


            //    if (initState !== actor.piece.getPieceActivationState()) {
            //    physicsApi.triggerPhysicallyActive(act
            // or);
            physicsApi.triggerPhysicallyActive(actor);
        //    this.simulationState.updateActiveActor(actor, tpf);

            actor.piece.rootObj3D.updateMatrixWorld();

            actor.piece.updatePieceStates(tpf);
            actor.piece.updatePieceSlots(tpf, this.simulationState);
            //     actor.piece.updatePieceVisuals(tpf);

            actor.samplePhysicsState();
            this.protocolSystem.updateActorSendProtocol(actor, tpf);

        };


        SimulationProcessor.prototype.processActorFrame = function(actor, playerPos, tpf, visibleRange, activateRange) {

            if (actor.physicalPiece.getPhysicsPieceMass() === 0) {
                this.simulationState.updateStaticActor(actor, tpf);
                return;
            }

            var initState = actor.piece.getPieceActivationState();
            this.protocolSystem.applyProtocolToActorState(actor, tpf);

            if (!actor.body) {
                return;
            }



            if (initState === ENUMS.PieceActivationStates.INACTIVE) {
                actor.piece.updatePieceStates(tpf);
                actor.piece.updatePieceSlots(tpf, this.simulationState);
                this.protocolSystem.updateActorSendProtocol(actor, tpf);
                return;
            }

            var combatStatus = actor.piece.getCombatStatus();

            if (combatStatus) {
                combatStatus.tickCombatStatus();

                if (combatStatus.getCombatState()) {

                    actor.setActivationState(ENUMS.PieceActivationStates.ENGAGED);
                    physicsApi.triggerPhysicallyActive(actor);
                    this.activityFilter.notifyActorActiveState(actor, true);

                } else {

                    if (actor.isEngaged()) {
                        actor.deescalateActivationState();
                        this.activityFilter.notifyActorActiveState(actor, true);
                    } else {

                        var range = this.simulationState.checkActorInRangeFromPosition(actor, activateRange + actor.piece.boundingSize, playerPos);

                        if (range === actor) {
                            this.activityFilter.notifyActorActiveState(actor, true);
                            physicsApi.triggerPhysicallyActive(actor)
                            if (initState < ENUMS.PieceActivationStates.VISIBLE) {
                                actor.escalateActivationState();
                            }
                        } else {
                            this.activityFilter.notifyActorActiveState(actor, physicsApi.isPhysicallyActive(actor));
                            //    physicsApi.triggerPhysicallyRelaxed(actor)
                        }

                    }
                }
            }


            if (this.activityFilter.getActorExpectActive(actor)) {
                this.simulationState.updateActiveActor(actor, tpf);
            } else {

                var range = this.simulationState.checkActorInRangeFromPosition(actor, visibleRange + actor.piece.boundingSize, playerPos);

                if (range === actor) {

                    actor.piece.setPieceActivationState(ENUMS.PieceActivationStates.VISIBLE);


                    //    if (initState !== actor.piece.getPieceActivationState()) {
                    //    physicsApi.triggerPhysicallyActive(act
                    // or);
                    physicsApi.triggerPhysicallyActive(actor);
                    this.simulationState.updateActiveActor(actor, tpf);
                    //    }


                } else {
                    actor.piece.setPieceActivationState(ENUMS.PieceActivationStates.HIDDEN);

                    //    actor.deescalateActivationState();
                    if (initState !== actor.piece.getPieceActivationState()) {
                        this.simulationState.updateActiveActor(actor, tpf);
                    }
                    this.protocolSystem.updateActorSendProtocol(actor, tpf);
                    physicsApi.triggerPhysicallyRelaxed(actor)

                }

            }

            if (initState === actor.piece.getPieceActivationState()) {
                actor.piece.framesAtState ++;
            } else {
                actor.piece.framesAtState = 0;
            }

        };


        SimulationProcessor.prototype.processLevelFrame = function(time, tpf, attacks, playerPos, activationStates) {

            ThreeAPI.getScene().updateMatrixWorld();


            physicsApi.updatePhysicsSimulation(time);

            if (this.simulationState.controlledActorId) {
                playerPos.copy(this.simulationState.getActorById(this.simulationState.controlledActorId).piece.getPos());
            }

            for (var i = 0; i < attacks.length; i++) {
                this.simulationState.updateAttackFrame(attacks[i], tpf);
            }

            for ( i = 0; i < actors.length; i++) {

                activationStates[actors[i].piece.pieceActivationState] ++;

                if (!actors[i].isInactive()) {
                    this.simulationState.updateActorFrame(actors[i], tpf);
                }
            }

        };


        return SimulationProcessor;

    });


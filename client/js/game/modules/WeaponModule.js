
"use strict";


define([
        'PipelineObject'
    ],
    function(
        PipelineObject
    ) {

    var tempVec = new THREE.Vector3();
    var tempVec2 = new THREE.Vector3();
    var tempObj3D = new THREE.Object3D();
    var outOfRange;


        var dynamic = {
            fromX:           {state:0},
            fromY:           {state:0},
            fromZ:           {state:0},
            toX:             {state:0},
            toY:             {state:0},
            toZ:             {state:0},
            travelTime:      {state:0},
            triggerCommand:  {state:0},
            activateCommand: {state:0}
        };

        var WeaponModule = function(dataKey, ready, index) {

            this.weaponIndex = index;

            this.dynamic = {
                fromX:           {state:0},
                fromY:           {state:0},
                fromZ:           {state:0},
                toX:             {state:0},
                toY:             {state:0},
                toZ:             {state:0},
                travelTime:      {state:0},
                triggerCommand:  {state:0},
                activateCommand: {state:0}
            };

            this.dataKey = dataKey;

            this.selectedTarget = null;
            this.targetFocusTime = 0;
            this.cooldownCountdown = 0;

            this.activationFrame = 0;

            var applyChannelData = function() {
                this.applyData(this.pipeObj.buildConfig()[this.dataKey]);
                ready(this);
            }.bind(this);

            this.pipeObj = new PipelineObject('WEAPON_DATA', 'WEAPONS', applyChannelData, this.dataKey);
        };

        WeaponModule.prototype.getStateKeyForStateId = function (stateId) {
            for (var i = 0; i < this.feedbackMap.length; i++) {
                if (this.feedbackMap[i].stateid === stateId) {
                    return this.feedbackMap[i].key;
                }
            }
        };

        WeaponModule.prototype.applyWeaponTrigger = function(value, module, callFireWeapon) {
            callFireWeapon(this.dynamic, module, this.weaponOptions);
        };

        WeaponModule.prototype.activateWeaponFrame = function (value) {
            this.fireFrame = value;
        };

        WeaponModule.prototype.setupDynamicState = function (stateId, value) {
            var stateKay = this.getStateKeyForStateId(stateId);
            this.dynamic[stateKay].state = value;

        };

        WeaponModule.prototype.applyData = function (config) {
            this.config = config;
            this.stateMap = config.state_map;
            this.feedbackMap = config.feedback_map;
            this.weaponOptions = config.weapon.options;
        };

        WeaponModule.prototype.setSelectedTarget = function (selectedTarget) {
            this.targetFocusTime = 0;
            this.selectedTarget = selectedTarget;
        };


        WeaponModule.prototype.selectNearbyHostileActor = function(simulationState, module, tpf) {

            this.targetFocusTime += tpf;

            module.getObjec3D().updateMatrixWorld();

        //    module.getObjec3D().getWorldPosition(tempObj3D.position);

            tempObj3D.position.setFromMatrixPosition( module.getObjec3D().matrixWorld );

            outOfRange = this.weaponOptions.range;

            var nearestDistance = outOfRange;
            var distance = nearestDistance;

            var actors = simulationState.getActors();

            var selectedTarget = null;

            for (var i = 0; i < actors.length; i++) {
                if (actors[i].config.alignment === 'hostile') {
                    distance = Math.sqrt(actors[i].piece.getPos().distanceToSquared(tempObj3D.position));
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        selectedTarget = actors[i];
                    }
                }
            }

            if (this.selectedTarget !== selectedTarget) {
                this.setSelectedTarget(selectedTarget);
            }

            return selectedTarget;
        };

        WeaponModule.prototype.aimAtTargetActor = function(targetActor, module) {

            tempVec2.copy(targetActor.piece.getPos());

            module.getObjec3D().parent.worldToLocal( tempVec2 );
            module.getObjec3D().lookAt( tempVec2 );
        };


        WeaponModule.prototype.generateActiveBullet = function() {

            var fromVec = tempObj3D.position;
            var toVec = this.selectedTarget.piece.getPos();

            this.dynamic.fromX.state = fromVec.x;
            this.dynamic.fromY.state = fromVec.y;
            this.dynamic.fromZ.state = fromVec.z;

            this.dynamic.toX.state = toVec.x;
            this.dynamic.toY.state = toVec.y;
            this.dynamic.toZ.state = toVec.z;

            var distance = Math.sqrt(fromVec.distanceToSquared(toVec));

            this.dynamic.travelTime.state = distance / this.weaponOptions.velocity;
            this.dynamic.activateCommand.state = 1;
        };

        WeaponModule.prototype.clearDynamicState = function() {
            for (var key in this.dynamic) {
                this.dynamic[key].state = 0;
            }
        };

        WeaponModule.prototype.determineBulletActivate = function(module) {

            if (this.cooldownCountdown <= 0) {
                this.generateActiveBullet();
                this.cooldownCountdown = this.weaponOptions.cooldown;
                this.activationFrame = 1;
            } else {

            }

            if (this.activationFrame !== 1) {
                this.dynamic.activateCommand.state = 0;
            }

            this.activationFrame--;

        };

        WeaponModule.prototype.determineTriggerState = function(module) {

            if (this.targetFocusTime > this.weaponOptions.focus_time) {
                this.dynamic.triggerCommand.state = 1;
                this.determineBulletActivate(module)
            } else {
                this.dynamic.triggerCommand.state = 0;
            }

        };

        WeaponModule.prototype.sampleState = function(targetActor, module) {

            for (var i = 0; i < this.stateMap.length; i++) {
                var state = module.getPieceStateById(this.stateMap[i].stateid);
                var param = this.stateMap[i].param;
                var axis = this.stateMap[i].axis;
                var value = module.getObjec3D()[param][axis];
                state.value = value;
            }
        };

        WeaponModule.prototype.clearFeedbackMap = function(module, feedback) {
            var targetStateId = feedback.stateid;
            var state =         module.getPieceStateById(targetStateId);
            state.value =       0;
        };

        WeaponModule.prototype.interpretWeaponState = function(param, key, property) {
            return this[param][key][property];
        };

        WeaponModule.prototype.applyFeedbackMap = function(module, feedback) {
            var param =         feedback.param;
            var key =           feedback.key;
            var property =      feedback.property;
            var targetStateId = feedback.stateid;
            var factor =        feedback.factor;
            var state =         module.getPieceStateById(targetStateId);
            state.value =       this.interpretWeaponState(param, key, property) * factor;
        };

        WeaponModule.prototype.applyFeedback = function(module, feedbackMap) {
            for (var i = 0; i < feedbackMap.length; i++) {
                this.applyFeedbackMap(module, feedbackMap[i]);
            }
        };

        WeaponModule.prototype.updateWeaponState = function(simulationState, module, tpf) {
            if (!this.config) return;

            var target = this.selectNearbyHostileActor(simulationState, module, tpf);
            if (target) {

                this.aimAtTargetActor(target, module);
                this.determineTriggerState(module);


            } else {
                module.getObjec3D().rotation.x = 0;
                module.getObjec3D().rotation.y = 0;
                module.getObjec3D().rotation.z = 0;
            }

            this.cooldownCountdown -= tpf;

            this.sampleState(target, module);

            this.applyFeedback(module, this.feedbackMap);


        };

        WeaponModule.prototype.removeWeaponModule = function () {
            this.pipeObj.removePipelineObject();
        };

        return WeaponModule
    });
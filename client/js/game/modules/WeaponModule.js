
"use strict";


define([
        'PipelineObject'
    ],
    function(
        PipelineObject
    ) {

    var aimVec = new THREE.Vector3();
    var tempVec = new THREE.Vector3();
    var tempVec2 = new THREE.Vector3();
    var tempObj3D = new THREE.Object3D();
    var outOfRange;

        var nearestDistance;

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

        WeaponModule.prototype.applyWeaponTrigger = function(state, module, callFireWeapon) {
            if (this.dynamic.activateCommand.state) {
                callFireWeapon(this.dynamic, module, this.weaponOptions);
                state.buffer[0] = 0;
                this.dynamic.activateCommand.state = 0;
            }

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
            this.dynamic.activateCommand.state = 0;
            this.dynamic.triggerCommand.state = 0;
            this.targetFocusTime = 0;
            this.selectedTarget = selectedTarget;
        };

        WeaponModule.prototype.getMuzzlePosition = function (module, vec3) {
            var ap = module.getAttachmentPointById(this.weaponOptions.muzzle_attachment_point_id);
            var muzzleModule = ap.getAttachedModule();

            vec3.setFromMatrixPosition( muzzleModule.getObjec3D().matrixWorld );
        };


        WeaponModule.prototype.selectNearbyHostileActor = function(simulationState, module, tpf) {

            this.targetFocusTime += tpf;

            module.getObjec3D().updateMatrixWorld();

        //    module.getObjec3D().getWorldPosition(tempObj3D.position);

            this.getMuzzlePosition(module, tempObj3D.position);

            outOfRange = this.weaponOptions.range;

            nearestDistance = outOfRange;
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

            aimVec.copy(targetActor.piece.getPos());

                tempVec2.set(Math.random()-0.5,Math.random()-0.5,Math.random()-0.5);
                tempVec2.normalize();
                tempVec2.multiplyScalar(Math.random() * this.weaponOptions.bullet_spread * (2 + nearestDistance * 0.1) * (0.8 + nearestDistance*0.2));

            aimVec.x += tempVec2.x;
            aimVec.y += tempVec2.y;
            aimVec.z += tempVec2.z;

            module.getObjec3D().parent.worldToLocal( aimVec );
            module.getObjec3D().lookAt( aimVec );
        };


        WeaponModule.prototype.generateActiveBullet = function() {

            var fromVec = tempObj3D.position;


            aimVec.copy(this.selectedTarget.piece.getPos());
            aimVec.x += tempVec2.x;
            aimVec.y += tempVec2.y;
            aimVec.z += tempVec2.z;


            this.dynamic.fromX.state = fromVec.x;
            this.dynamic.fromY.state = fromVec.y;
            this.dynamic.fromZ.state = fromVec.z;

            this.dynamic.toX.state = aimVec.x;
            this.dynamic.toY.state = aimVec.y;
            this.dynamic.toZ.state = aimVec.z;

        //    var distance = Math.sqrt(fromVec.distanceToSquared(aimVec));

            this.dynamic.travelTime.state = nearestDistance / this.weaponOptions.velocity;
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

"use strict";


define([
        'Events',
        'PipelineObject',
        'ThreeAPI',
        'game/pieces/PieceSlot',
        'game/pieces/PieceState',
        'game/combat/CombatStatus'
    ],
    function(
        evt,
        PipelineObject,
        ThreeAPI,
        PieceSlot,
        PieceState,
        CombatStatus
    ) {


        var GamePiece = function(hostId, dataKey, ready) {

            this.pieceId = hostId+'_piece_'+dataKey;
            this.id = this.pieceId;

            this.dataKey = dataKey;
            this.render = false;
            this.frustumCoords = new THREE.Vector3();
            this.cameraDistance = 0;
            this.pieceStates = [];
            this.rootObj3D = ThreeAPI.createRootObject();

            this.enable = true;

            this.combatStatus = null;

            var controlsEnable = function(bool) {
                if (typeof(bool) !== 'boolean') {
                    if (this.enable) {
                        return this
                    }
                    return this.enable
                }
                this.enable = bool;
            }.bind(this);

            this.enabler = controlsEnable;

            this.trigger = 0;

            var applyPieceData = function() {
                if (this.trigger !== 0) {
                    console.log("Re-Trigger data", this)
                }
                this.applyPieceData(this.pipeObj.buildConfig()[dataKey], ready);
                this.trigger++;
            }.bind(this);

            this.pipeObj = new PipelineObject('PIECE_DATA', 'PIECES', applyPieceData, dataKey);
        };



        GamePiece.prototype.initGamePiece = function() {

            if (this.pieceStates.length) {
                this.resetGamePiece();
            }

            this.pieceSlots = [];
            this.attachmentPoints = [];
            this.moduleChannels = [];
            this.boundingSize = 10;

            if (this.config.combat_stats) {
                this.setupCombatStatus(this.config.combat_stats)
            }
        };

        GamePiece.prototype.resetGamePiece = function() {

            ThreeAPI.removeChildrenFrom(this.rootObj3D);

            if (this.pieceSlots) {
                while (this.pieceSlots.length) {
                    this.pieceSlots.pop().removePieceSlot();
                }
            }
        };

        GamePiece.prototype.buildHierarchy = function () {


            if (!this.getSlotById(this.config.root_slot).isRootSlot) {
                this.getSlotById(this.config.root_slot).setObject3dToPieceRoot(this.rootObj3D);
            }

            for (var i = 0; i < this.config.attachments.length;i++) {
               var aps = this.config.attachments[i];
               this.setSlotAttachment(aps.slot, aps.ap, aps.child)
            }
        };

        GamePiece.prototype.setupCombatStatus = function(combatStats) {
            this.combatStatus = new CombatStatus(combatStats)
        };

        GamePiece.prototype.getCombatStatus = function() {
            return this.combatStatus;
        };

        GamePiece.prototype.setActor = function(actor) {
            this.actor = actor;
        };

        GamePiece.prototype.getActor = function() {
            return this.actor;
        };

        GamePiece.prototype.setSlotAttachment = function(parentSlotId, apId, childSlotId) {
            var ap = this.getSlotById(parentSlotId).getAttachmentPointById(apId);
            ap.setAttachedModule(this.getSlotById(childSlotId).module);
            this.getSlotById(childSlotId).attachToObject3d(ap.object3D);
        };


        GamePiece.prototype.applyPieceData = function (config, ready) {
            if (this.config === config) return;
            this.config = config;
            this.initGamePiece();
            var slotsReady = function() {
                this.attachPieceStates();
                this.buildHierarchy();
                ready(this);
            }.bind(this);

            if (config['slots']) {
                this.attachPieceSlots(config['slots'], slotsReady);
            }

        };


        GamePiece.prototype.calculateBoundingRadius = function() {

            var biggest = 1;
            for (var i = 0; i < this.pieceSlots.length; i++) {
                var slot = this.pieceSlots[i];
                if (slot.module.transform) {
                    for (var j = 0; j < slot.module.transform.size.length; j++) {
                        if (slot.module.transform.size[j] > biggest) {
                            biggest = slot.module.transform.size[j];
                        }
                    }
                }
            }
            return biggest * 0.69;
        };

        GamePiece.prototype.attachPieceSlots = function (slots, slotsReady) {

            var attachCount = slots.length;
            var attached = 0;

            var ready = function(slot) {

                attached++;
                if (this.getSlotById(slot.id)) {
                    this.getSlotById(slot.id).setSlotModule(slot.module);
                } else {
                    this.pieceSlots.push(slot);
                }

                if (attached === attachCount) {
                    slotsReady();
                    this.boundingSize = this.calculateBoundingRadius();
                }
            }.bind(this);

            for (var i = 0; i < slots.length; i++) {
                var slot = new PieceSlot(slots[i].slot, i);
                slot.setSlotModuleId(slots[i].module, ready)
            }
        };

        GamePiece.prototype.attachPieceStates = function() {

            for (var i = 0; i < this.pieceSlots.length; i++) {
                var slot = this.pieceSlots[i];
                this.attachStatesToChannels(slot.getModuleChannels());
            }
        };

        GamePiece.prototype.attachStatesToChannels = function(moduleChannels) {

            for (var i = 0; i < moduleChannels.length; i++) {
                if (!this.getPieceStateByStateId(moduleChannels[i].stateid)) {
                    this.pieceStates.push(new PieceState(moduleChannels[i].stateid, 0))
                }
                moduleChannels[i].attachPieceState(this.getPieceStateByStateId(moduleChannels[i].stateid))
            }
        };

        GamePiece.prototype.getSlotById = function (id) {
            for (var i = 0; i < this.pieceSlots.length;i++) {
                if (this.pieceSlots[i].id === id) {
                    return this.pieceSlots[i];
                }
            }
        };

        GamePiece.prototype.getSlotByIndex = function (slotIndex) {
            for (var i = 0; i < this.pieceSlots.length;i++) {
                if (this.pieceSlots[i].slotIndex === slotIndex) {
                    return this.pieceSlots[i];
                }
            }
        };

        GamePiece.prototype.getPos = function() {
            return this.rootObj3D.position;
        };

        GamePiece.prototype.getQuat = function () {
            return this.rootObj3D.quaternion;
        };

        GamePiece.prototype.getPieceStateByStateId = function (id) {
            for (var i = 0; i < this.pieceStates.length;i++) {

                if (this.pieceStates[i].id === id) {
                    return this.pieceStates[i];
                }
            }
        };


        GamePiece.prototype.setRendereable = function(bool) {
            if (bool) {
                ThreeAPI.showModel(this.rootObj3D);
            } else {
                ThreeAPI.hideModel(this.rootObj3D)
            }

            this.render = bool;
        };

        GamePiece.prototype.getScreenPosition = function (store) {
            ThreeAPI.toScreenPosition(this.rootObj3D.position, store);
        };

        GamePiece.prototype.determineVisibility = function() {
            if (!this.enable) return;
            var distance = ThreeAPI.distanceToCamera(this.rootObj3D.position);

            this.cameraDistance = distance;

            if (distance < this.boundingSize / 2) {

                this.setRendereable(true);
                return this.render;
            }

            if (distance >  150 + Math.sqrt(this.boundingSize + 10) + 10 * this.boundingSize * this.boundingSize) {
                if (this.render) {
                    this.setRendereable(false);
                }
                return this.render;
            }

            this.getScreenPosition(this.frustumCoords);

            if (MATH.valueIsBetween(this.frustumCoords.x, 0, 1) && MATH.valueIsBetween(this.frustumCoords.y, 0, 1) ) {
                this.setRendereable(true);
            } else {

                if (ThreeAPI.checkVolumeObjectVisible(this.rootObj3D.position, this.boundingSize)) {
                    this.setRendereable(true);
                } else {
                    this.setRendereable(false);
                }
            }

            return this.render;
        };


        GamePiece.prototype.updatePieceStates = function (tpf, time) {
            for (var i = 0; i < this.pieceStates.length; i++) {
                this.pieceStates[i].updateStateFrame(tpf, time)
            }
        };

        GamePiece.prototype.updatePieceSlots = function(tpf, simulate) {
            for (var i = 0; i < this.pieceSlots.length;i++) {
                this.pieceSlots[i].updatePieceSlot(this.render, this.enabler, tpf, simulate);
            }
        };

        GamePiece.prototype.updatePieceVisuals = function (tpf) {
            for (var i = 0; i < this.pieceSlots.length;i++) {
                this.pieceSlots[i].updatePieceVisuals(tpf);
            }
        };

        GamePiece.prototype.updateGamePiece = function(tpf, time, simulate) {

            this.updatePieceStates(tpf, time);
            this.updatePieceSlots(tpf, simulate);
            this.updatePieceVisuals(tpf);

        };

        GamePiece.prototype.removeGamePiece = function () {

            this.pipeObj.removePipelineObject();
            for (var i = 0; i < this.pieceSlots.length;i++) {
                this.pieceSlots[i].removePieceSlot();
            }
            ThreeAPI.disposeModel(this.rootObj3D);
        };

        return GamePiece
    });
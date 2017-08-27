
"use strict";


define([
        'Events',
        'PipelineObject',
        'ThreeAPI',
        'game/pieces/PieceSlot',
        'game/pieces/PieceState'
    ],
    function(
        evt,
        PipelineObject,
        ThreeAPI,
        PieceSlot,
        PieceState
    ) {


        var GamePiece = function(hostId, dataKey, ready) {

            this.pieceId = hostId+'_piece_'+dataKey;
            this.dataKey = dataKey;
            this.render = false;
            this.frustumCoords = new THREE.Vector3();
            this.pieceStates = [];
            this.rootObj3D = ThreeAPI.createRootObject();

            var applyPieceData = function() {
                this.applyPieceData(this.pipeObj.buildConfig()[dataKey], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('PIECE_DATA', 'PIECES', applyPieceData);
        };



        GamePiece.prototype.initGamePiece = function() {

            if (this.pieceStates.length) {
                this.resetGamePiece();
            }

            this.pieceSlots = [];
            this.attachmentPoints = [];
            this.moduleChannels = [];
            this.boundingSize = 10;
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

        GamePiece.prototype.setSlotAttachment = function(parentSlotId, apId, childSlotId) {
            var ap = this.getSlotById(parentSlotId).getAttachmentPointById(apId);
            console.log("Set attachment", [ap, apId]);
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
            return biggest * 0.65 * 2;
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
                    console.log("Slots Ready!");
                    slotsReady();
                    this.boundingSize = this.calculateBoundingRadius();
                }
            }.bind(this);

            for (var i = 0; i < slots.length; i++) {
                var slot = new PieceSlot(slots[i].slot);
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

        GamePiece.prototype.getPieceStateByStateId = function (id) {
            for (var i = 0; i < this.pieceStates.length;i++) {

                if (this.pieceStates[i].id === id) {
                    return this.pieceStates[i];
                }
            }
        };


        GamePiece.prototype.setRendereable = function(bool) {
            this.render = bool;
        };

        GamePiece.prototype.getScreenPosition = function (store) {
            ThreeAPI.toScreenPosition(this.rootObj3D.position, store);
        };

        GamePiece.prototype.determineVisibility = function() {
            var distance = ThreeAPI.distanceToCamera(this.rootObj3D.position);

            if (distance < this.boundingSize) {

                this.setRendereable(true);
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


        GamePiece.prototype.updateGamePiece = function(tpf, time) {

            for (var i = 0; i < this.pieceStates.length; i++) {
                this.pieceStates[i].updateStateFrame(tpf, time)
            }

            for (i = 0; i < this.pieceSlots.length;i++) {
                this.pieceSlots[i].updatePieceSlot(this.render);
            }

            for (i = 0; i < this.pieceSlots.length;i++) {
                this.pieceSlots[i].updatePieceVisuals(tpf);
            }

        };

        GamePiece.prototype.removeGamePiece = function () {

            this.pipeObj.removePipelineObject();
            for (var i = 0; i < this.pieceSlots.length;i++) {
                this.pieceSlots[i].removePieceSlot();
            }
            ThreeAPI.removeModel(this.rootObj3D);
        };


        return GamePiece
    });

"use strict";


define([
        'Events',
        'PipelineObject',
        'ThreeAPI',
        'game/PieceSlot',
        'game/PieceState'
    ],
    function(
        evt,
        PipelineObject,
        ThreeAPI,
        PieceSlot,
        PieceState
    ) {


    var gamePieces = 0;

        var GamePiece = function(hostId, dataKey, ready) {
            gamePieces++;
            this.pieceId = hostId+'_piece_'+gamePieces;
            this.dataKey = dataKey;
            this.render = false;
            this.frustumCoords = new THREE.Vector3();

            this.rootObj3D = ThreeAPI.createRootObject();

            this.attachmentPoints = [];
            this.moduleChannels = [];

            this.boundingSize = 10;
            this.pieceSlots = [];
            this.pieceStates = [];

            var applyPieceData = function() {
                this.applyPieceData(this.pipeObj.buildConfig()[dataKey], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('PIECE_DATA', 'PIECES', applyPieceData);
        };


        GamePiece.prototype.buildHierarchy = function () {
            this.getSlotById(this.config.root_slot).attachToObject3d(this.rootObj3D);

            for (var i = 0; i < this.config.attachments.length;i++) {
               var aps = this.config.attachments[i];
               this.setSlotAttachment(aps.slot, aps.ap, aps.child)
            }
        };

        GamePiece.prototype.setSlotAttachment = function(parentSlotId, apId, childSlotId) {
            var ap = this.getSlotById(parentSlotId).getAttachmentPointById(apId);
            this.getSlotById(childSlotId).attachToObject3d(ap.object3D);
        };


        GamePiece.prototype.applyPieceData = function (config, ready) {
            this.config = config;

            var slotsReady = function() {
                this.attachPieceStates();
                this.buildHierarchy();
                ready(this);
            }.bind(this);

            if (config['slots']) {
                this.attachPieceSlots(config['slots'], slotsReady);
            }

        };

        GamePiece.prototype.attachPieceSlots = function (slots, slotsReady) {


            var ready = function(slot) {

                if (this.getSlotById(slot.id)) {
                    this.getSlotById(slot.id).setSlotModule(slot.module);
                } else {
                    this.pieceSlots.push(slot);
                }

                if (this.pieceSlots.length === slots.length) {
                    slotsReady();
                }
            }.bind(this);

            for (var i = 0; i < slots.length; i++) {
                var slot = new PieceSlot(slots[i].slot);
                slot.setSlotModuleId(slots[i].module, ready)
            }
        };

        GamePiece.prototype.attachPieceStates = function() {

            for (var i = 0; i < this.pieceSlots.length; i++) {
                var slot = this.pieceSlots[i];3
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
            this.determineVisibility();
            for (var i = 0; i < this.pieceStates.length; i++) {
                this.pieceStates[i].updateStateFrame(tpf, time)
            }

            for (var i = 0; i < this.pieceSlots.length;i++) {
                this.pieceSlots[i].updatePieceSlot(tpf, time, this.render);
            }
        };

        GamePiece.prototype.removeGamePiece = function () {

            this.pipeObj.removePipelineObject();
            for (var i = 0; i < this.pieceSlots.length;i++) {
                this.pieceSlots[i].removePieceSlot();
            }
        };


        return GamePiece
    });
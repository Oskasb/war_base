
"use strict";


define([
        'game/modules/GameModule'
    ],
    function(
        GameModule
    ) {


        var PieceSlot = function(id) {
            this.id = id;
            this.module;
            this.isRootSlot = false;
        };

        PieceSlot.prototype.setSlotModuleId = function(moduleId, ready) {
            var moduleReady = function(module) {
                this.setSlotModule(module)
                ready(this);
            }.bind(this);
            new GameModule(moduleId, moduleReady);
        };

        PieceSlot.prototype.setSlotModule = function (module) {
            if (this.module && this.module !== module) {
                this.module.removeClientModule();
            }
            this.module = module;
        };

        PieceSlot.prototype.getModuleChannels = function () {
            return this.module.moduleChannels;
        };

        PieceSlot.prototype.getAttachmentPointById = function (apId) {

            var ap = this.module.getAttachmentPointById(apId);
            if (!ap) {
                console.log("No AttachmentPoint by id:", apId, this.module);
                return;
            }
            return ap;

        };

        PieceSlot.prototype.getVisualObj3d = function () {
            return this.module.visualModule.getRootObject3d();
        };

        PieceSlot.prototype.setObject3dToPieceRoot = function (obj3d) {
            this.attachToObject3d(obj3d);
            this.module.setAsRootSlot(obj3d);
            this.isRootSlot = true;
        };

        PieceSlot.prototype.attachToObject3d = function (obj3d) {
            this.module.attachModuleToParent(obj3d);
        };

        PieceSlot.prototype.updatePieceSlot = function (render, enable, tpf, simulate) {
            this.module.sampleModuleFrame(render, enable, tpf, simulate);
        };

        PieceSlot.prototype.updatePieceVisuals = function (tpf) {
            this.module.updateVisualState(tpf);
        };

        PieceSlot.prototype.removePieceSlot = function () {
            this.module.removeClientModule();
        };

        return PieceSlot
    });
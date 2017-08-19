
"use strict";


define([
        'game/GameModule'
    ],
    function(
        GameModule
    ) {


        var PieceSLot = function(id) {
            this.id = id;
            this.module;
        };

        PieceSLot.prototype.setSlotModuleId = function(moduleId, ready) {
            var moduleReady = function(module) {
                this.setSlotModule(module)
                ready(this);
            }.bind(this);
            new GameModule(moduleId, moduleReady);
        };


        PieceSLot.prototype.setSlotModule = function (module) {
            if (this.module && this.module !== module) {
                this.module.removeClientModule();
            }
            this.module = module;
        };

        PieceSLot.prototype.getModuleChannels = function () {
            return this.module.moduleChannels;
        };

        PieceSLot.prototype.getModuleChannels = function () {
            return this.module.moduleChannels;
        };

        PieceSLot.prototype.getAttachmentPointById = function (apId) {

            var ap = this.module.getAttachmentPointById(apId);
            if (!ap) {
                console.log("No AttachmentPoint by id:", apId, this.module);
                return;
            }
            return ap;

        };

        PieceSLot.prototype.attachToObject3d = function (obj3d) {
            this.module.attachModuleToParent(obj3d);
        };

        PieceSLot.prototype.updatePieceSlot = function (tpf, time, render) {

            this.module.sampleModuleFrame(render);
        };

        PieceSLot.prototype.removePieceSlot = function () {
            this.module.removeClientModule();
        };

        return PieceSLot
    });
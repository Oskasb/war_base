
"use strict";


define([
        'Events',
        'PipelineObject',
        'game/modules/VisualModule',
        'game/modules/ModuleChannel',
        'game/modules/AttachmentPoint',
        'game/modules/WeaponModule'
    
    ],
    function(
        evt,
        PipelineObject,
        VisualModule,
        ModuleChannel,
        AttachmentPoint,
        WeaponModule
    ) {

        var GameModule = function(id, ready) {
            this.id = id;
            this.visualModule = new VisualModule(this);

            this.attachmentPoints = [];
            this.moduleChannels = [];

            this.weapons = [];

            this.transform = {
                rot:  [0, 0, 0],
                pos:  [0, 0, 0],
                size: [0, 0, 0]
            };

            var applyModuleData = function() {
                this.applyModuleData(this.pipeObj.buildConfig()[id], ready);
            }.bind(this);

            this.pipeObj = new PipelineObject('MODULE_DATA', 'MODULES', applyModuleData, id);
        };

        GameModule.prototype.getTransform = function () {
            return this.transform;
        };

        GameModule.prototype.getObjec3D = function () {
            return this.visualModule.getRootObject3d();
        };


        GameModule.prototype.setModel = function (model) {
            this.visualModule.attachModel(model);
        };

        GameModule.prototype.copyTransform = function (trnsf) {
            this.transform.pos[0] = trnsf.pos[0];
            this.transform.pos[1] = trnsf.pos[1];
            this.transform.pos[2] = trnsf.pos[2];

            this.transform.rot[0] = trnsf.rot[0];
            this.transform.rot[1] = trnsf.rot[1];
            this.transform.rot[2] = trnsf.rot[2];

            this.transform.size[0] = trnsf.size[0];
            this.transform.size[1] = trnsf.size[1];
            this.transform.size[2] = trnsf.size[2];
        };

        GameModule.prototype.applyModuleData = function (config, ready) {
            this.config = config;

            if (!this.config) return;
            if (this.config.transform) this.copyTransform(this.config.transform);

            this.visualModule.setModuleData(this.config);

            if (this.config.weapons) {

                var weaponReady = function(weapon) {
                    this.weapons[weapon.weaponIndex] = weapon
                }.bind(this);

                for (var i = 0; i < this.config.weapons.length; i++) {
                    new WeaponModule(this.config.weapons[i], weaponReady, i)
                }

            }

            if (config[ENUMS.ModuleParams.attachment_points]) {
                this.applyAttachmentPoints(config[ENUMS.ModuleParams.attachment_points]);
            }
            if (config[ENUMS.ModuleParams.channels]) {
                this.applyModuleChannels(config[ENUMS.ModuleParams.channels], ready);
            } else {
                ready(this);
            }
        };

        GameModule.prototype.applyAttachmentPoints = function (apData) {
            for (var i = 0; i < apData.length;i++) {

                if (this.getAttachmentPointById(apData[i].id)) {
                    this.getAttachmentPointById(apData[i].id).updateData(apData[i]);
                } else {
                    var ap = new AttachmentPoint(apData[i]);
                    this.attachmentPoints.push(ap);
                    ap.attachToParent(this.visualModule.rootObj);
                }
            }
        };

        GameModule.prototype.applyModuleChannels = function (channelData, ready) {

            var _this = this;
            for (var i = 0; i < channelData.length;i++) {

                if (this.getModuleChannelById(channelData[i].channelid)) {
                    console.log("Module Channel already attached", channelData[i])
                } else {
                    var cready = function(channel) {
                        _this.moduleChannels.push(channel);
                        if (_this.moduleChannels.length === channelData.length) {
                            ready(_this);
                        }
                    };
                    new ModuleChannel(channelData[i], cready);
                }
            }

            if (!channelData.length) ready(this);
        };

        GameModule.prototype.getAttachmentPointById = function (id) {
            for (var i = 0; i < this.attachmentPoints.length;i++) {
                if (this.attachmentPoints[i].id === id) {
                    return this.attachmentPoints[i];
                }
            }
        };

        GameModule.prototype.getModuleChannelById = function (id) {
            for (var i = 0; i < this.moduleChannels.length;i++) {
                if (this.moduleChannels[i].id === id) {
                    return this.moduleChannels[i];
                }
            }
        };

        GameModule.prototype.getPieceStateById = function (id) {
            for (var i = 0; i < this.moduleChannels.length;i++) {
                if (this.moduleChannels[i].state.id === id) {
                    return this.moduleChannels[i].state;
                }
            }

            var state;
            for (i = 0; i < this.attachmentPoints.length;i++) {

                var module = this.attachmentPoints[i].getAttachedModule();
                if (module) {
                    state = module.getPieceStateById(id);
                    if (state) {
                        return state;
                    }
                }
            }
        };

        GameModule.prototype.removeAttachmentPoints = function () {
            for (var i = 0; i < this.attachmentPoints.length;i++) {
                this.attachmentPoints[i].detatchAttachmentPoint();
            }
        };



        GameModule.prototype.monitorAttachmentPoints = function (bool) {
            for (var i = 0; i < this.attachmentPoints.length;i++) {
                this.attachmentPoints[i].visualiseAttachmentPoint(bool)
            }
        };

        GameModule.prototype.monitorGameModule = function (bool) {
            this.monitorAttachmentPoints(bool);

            if (bool) {
                this.visualModule.addModuleDebugBox();
            } else  {
                this.visualModule.removeModuleDebugBox();
            }
        };

        GameModule.prototype.setAsRootSlot = function (obj3d) {
            this.visualModule.replaceRootObject(obj3d);
        };

        GameModule.prototype.attachModuleToParent = function (parentModule) {
            this.visualModule.attachToParent(parentModule);
        };



        GameModule.prototype.sampleModuleFrame = function (render, enable, tpf, simState) {
            this.visualModule.setVisibility(render);
            for (var i = 0; i < this.moduleChannels.length; i++) {
                this.moduleChannels[i].updateChannelState(this, enable);
            }
            if (this.interpolateQuaternion) {
                this.visualModule.slerpTowardsTargetQuat(this.interpolateQuaternion)
            }

            if (simState) {
                for (i = 0; i < this.weapons.length; i++) {
                    this.weapons[i].updateWeaponState(simState, this, tpf)
                }
            }


        };

        GameModule.prototype.updateVisualState = function (tpf) {
            if (this.hidden) return;
            this.visualModule.updateVisualModule(tpf);
        };

        GameModule.prototype.removeClientModule = function () {
            this.pipeObj.removePipelineObject();
            this.visualModule.removeVisualModule();
            this.removeAttachmentPoints();

            while (this.moduleChannels.length) {
                this.moduleChannels.pop().removeModuleChannel();
            }


        };
        
        return GameModule
    });
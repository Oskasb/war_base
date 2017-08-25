"use strict";


define([
        'ThreeAPI'
    ],
    function(
        ThreeAPI
    ) {

    var cbs;

        var VisualModule = function(module) {
            this.module = module;
            this.hidden = false;
            this.rootObj = ThreeAPI.createRootObject();
            this.staticEffect = null;
            this.dynamicEffect = null;
            this.effectTargets = [];
            this.isVisible = false;
            this.model;
        };

        VisualModule.prototype.setModuleData = function(data) {
            this.data = data;
            if (this.data.model) {
                if (this.model) {
                    ThreeAPI.removeModel(this.model);
                }
            }

            if (this.data.terrain) {
            //    this.module.transform.pos[0]  = //-this.data.options.terrain_size / 1;
                this.module.transform.pos[1]  = this.data.options.max_height   / 2;
            //    this.module.transform.pos[2]  = //-this.data.options.terrain_size / 1;
                this.module.transform.size[0] = this.data.options.terrain_size;
                this.module.transform.size[1] = this.data.options.max_height  ;
                this.module.transform.size[2] = this.data.options.terrain_size;
            }
        };


        VisualModule.prototype.loadVisualModule = function() {

            if (this.model) {
                ThreeAPI.removeModel(this.model);
            }

            if (this.data.model) {
                this.attachModel(ThreeAPI.loadMeshModel(this.data.model, ThreeAPI.createRootObject()));
                return;
            }

            if (this.data.terrain) {
                var parent = this.rootObj;
                parent.position.x -= this.data.options.terrain_size / 1;
                parent.position.z -= this.data.options.terrain_size / 1;
            //    GameAPI.createTerrain(this.data.options, onData);
                return;
            }

        };

        VisualModule.prototype.hide = function() {
            this.hidden = true;
            this.rootObj.remove(this.model);
        };

        VisualModule.prototype.show = function() {
            this.hidden = false;
            if (this.model) {
                this.rootObj.add(this.model);
            }
        };

        VisualModule.prototype.attachModel = function(model) {
            if (this.model) {
                ThreeAPI.removeModel(this.model);
            }
            this.model = model;
            this.rootObj.add(this.model);
        };

        VisualModule.prototype.showVisualModule = function() {
            console.log("show")
            cbs = ThreeAPI.getEffectCallbacks();
            if (this.model) {
                ThreeAPI.showModel(this.model);
                this.rootObj.add(this.model);
            } else {
                if (this.data.model || this.data.terrain) {
                    this.loadVisualModule();
                }
            }
        };

        VisualModule.prototype.hideVisualModule = function() {
            console.log("hide");
            if (this.model) {
                ThreeAPI.removeModel(this.model);
                this.model = null;
            }
        };

        VisualModule.prototype.setVisibility = function(bool) {

            if (this.isVisible === bool) {
                return;
            }


            this.isVisible = bool;

            if (this.data.terrain) {
                if (this.model) {
                    if (bool) {
                        this.rootObj.add(this.model);
                    } else {
                        this.rootObj.remove(this.model);
                    }
                }
                return;
            }

                if (bool) {
                    this.showVisualModule()
                } else {
                    this.hideVisualModule()
                }

        };

        VisualModule.prototype.transformObj = function(obj3d, transform) {
            ThreeAPI.transformModel(
                obj3d,
                transform.pos[0], transform.pos[1], transform.pos[2],
                transform.rot[0], transform.rot[1], transform.rot[2]
            )
        };

        VisualModule.prototype.checkVisibility = function() {
            if (this.model && this.data.model) {
                if (this.model.children[0]) {
                    return this.isVisible;
                } else {
                    return false;
                }
            }
            return this.isVisible;
        };

        VisualModule.prototype.addModuleDebugBox = function() {

            var trnsf = this.module.getTransform();
            this.debugModel = ThreeAPI.loadDebugBox(trnsf.size[0], trnsf.size[1], trnsf.size[2]);
            this.debugRoot  = ThreeAPI.loadDebugBox(0.1, 0.1, 0.1, 'blue');

            ThreeAPI.addChildToObject3D(this.debugModel, this.rootObj);

            ThreeAPI.addChildToObject3D(this.debugRoot, this.rootObj);
            this.transformObj(this.debugModel, trnsf);
        };

        VisualModule.prototype.removeModuleDebugBox = function() {
            if (this.debugModel) {
                this.rootObj.remove(this.debugModel);
            }
            if (this.debugRoot) {
                this.rootObj.remove(this.debugRoot);
            }
        };

        VisualModule.prototype.addEffectTarget = function(target) {

            if (this.effectTargets.indexOf(target) === -1) {
                this.effectTargets.push(target);
            }

        };

        VisualModule.prototype.getRootObject3d = function() {
            return this.rootObj;
        };

        VisualModule.prototype.getParentObject3d = function() {
            return this.parentObject3d;
        };

        VisualModule.prototype.replaceRootObject = function(obj3d) {
            while (this.rootObj.children.length) {
                var child = this.rootObj.children[0];
                this.rootObj.remove(child);
                obj3d.add(child);
            }

            this.rootObj = obj3d;

        };

        VisualModule.prototype.attachToParent = function(parentObject3d) {

            if (this.rootObj == parentObject3d) {
                console.log("Parent Equals Root:", this)
            } else {
                ThreeAPI.addChildToObject3D(this.rootObj, parentObject3d);
            }

            this.parentObject3d = parentObject3d;
        };

        VisualModule.prototype.removeVisualModule = function() {
            for (var i = 0; i < this.effectTargets.length; i++) {
                this.effectTargets[i].removeEffectTarget();
                if (this.effectTargets[i].effectArray.length) {
                    cbs.remove_module_static_effect(this.effectTargets[i].effectArray)
                }

            //    this.processVisualEffect(this.effectTargets[i], 0);
            };

            if (this.model) {
             //   this.rootObj.remove(this.model);
                if (this.hidden) this.show();
                ThreeAPI.removeModel(this.rootObj);
            }
            this.removeModuleDebugBox();
        };

        VisualModule.prototype.processVisualEffect = function(target, tpf) {
            cbs[target.config.callback](this, target, tpf);
        };

        VisualModule.prototype.updateVisualModule = function(tpf) {
            if (!this.checkVisibility()) return;
            for (var i = 0; i < this.effectTargets.length; i++) {
                this.processVisualEffect(this.effectTargets[i], tpf);
            }
        };

        return VisualModule;

    });
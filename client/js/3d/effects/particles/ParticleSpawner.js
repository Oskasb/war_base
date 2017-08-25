"use strict";

define([
        'ThreeAPI',
        '3d/effects/particles/ParticleEffectData',
        '3d/effects/particles/ParticleEffect',
        '3d/effects/particles/EffectDataTranslator',
        '3d/effects/particles/ParticleRenderer',
        'PipelineObject'
    ],
    function(
        ThreeAPI,
        ParticleEffectData,
        ParticleEffect,
        EffectDataTranslator,
        ParticleRenderer,
        PipelineObject
    ) {

        var renderers = {};
        var activeEffects = [];
        var idleEffects = [];
        var endedEffects = [];
        var fxAdds = 0;
        var systemTime = 0;

        var started = 0;
        var finished = 0;
        
        var ready = function() {};
        
        var rendererReady = function(renderer) {
            if (!renderers[renderer.id]) {
                renderers[renderer.id] = [];
            }
            renderers[renderer.id].push(renderer);
            finished ++;

    //        console.log("ParticleSpawner load: r/s", started, finished);
            if (started == finished) {
                ready();
            }
        };
        
        
        var ParticleSpawner = function() {
            this.particleEffectData = new ParticleEffectData();
            this.particleEffectData.loadEffectData();

        };

        ParticleSpawner.prototype.initParticleSpawner = function(onReady) {

            this.setupParticleRenderers();

            ready = onReady;
        };

        ParticleSpawner.prototype.setupParticleRenderers = function() {


    //        console.log("SETUP PARTICLE RENDERERS");

            var addRen = function(data) {
                this.addRenderer(data, rendererReady);
            }.bind(this);

            
            
            var renderersData = function(src, data) {
                for (var i = 0; i < data.length; i++) {

                    started++;

    //                console.log("SETUP PARTICLE RENDERER:", src, data[i]);
                /*
                    if (renderers[data[i].id]) {
                        console.log("DELETE EXISTING PARTICLE RENDERER", data[i].id);
                        renderers[data[i].id].dispose();
                        delete renderers[data[i].id];
                    }
                 */
                    addRen(data[i]);

                }
            };
            
            new PipelineObject("PARTICLE_SYSTEMS", "RENDERERS", renderersData);
        };

        ParticleSpawner.prototype.addRenderer = function(rendererData, onReady) {
            new ParticleRenderer(rendererData, onReady);
        };

        ParticleSpawner.prototype.getRenderersById = function(id) {

            return renderers[id];

        };


        ParticleSpawner.prototype.getEffect = function() {

            if (idleEffects.length != 0) {
                return idleEffects.shift();
            } else {
                return new ParticleEffect();
            }
        };


        ParticleSpawner.prototype.renderEffect = function(renderer, effect) {
            EffectDataTranslator.interpretCustomEffectData(effect.effectData, effect.effectData.particle.config);

            effect.attachSimulators();
            effect.applyRenderer(renderer, systemTime);

            if (!effect.aliveParticles.length) {
                return
            }

            return effect;
        };


        ParticleSpawner.prototype.duplicateRenderer = function(renderer, effect) {

            if (renderer.adding) return this.renderEffect(renderer, effect);

            var onReady = function(rndr) {
                rendererReady(rndr);
                console.log("add renderer for particle group");
                renderer.adding = false;
            }

            renderer.adding = true;
            //   if (!renderer.particles.length) {
            console.log("request new renderer...");
            this.addRenderer(renderer.config, onReady);
            return this.renderEffect(renderer, effect);

        };

        ParticleSpawner.prototype.buildEffect = function(id, pos, vel, size, quat) {

            var effect = this.getEffect();

            effect.setEffectPosition(pos);
            
            if (size) {
                effect.setEffectSize(size);
            } else {
                effect.size.x = 0;
                effect.size.y = 0;
                effect.size.z = 0;
            }

            if (quat) {
                effect.setEffectQuaternion(quat);
            } else {
                effect.quat.x = 0;
                effect.quat.y = 0;
                effect.quat.z = 0;
                effect.quat.w = 1;
            }
            
            effect.setEffectVelocity(vel);
            effect.setEffectData(this.particleEffectData.buildEffect(effect.effectData, 'THREE', id));

            var renderer = this.getRenderersById(effect.effectData.effect.renderer_id);

            if (!renderer) {
                console.log("Renderer not yet ready...", effect.effectData.effect.renderer_id);
                return;
            }

            for (var i = 0; i < renderer.length; i++) {
                if (renderer[i].particles.length > 25) {
                    return this.renderEffect(renderer[i], effect);
                }
            }

            return this.duplicateRenderer(renderer[0], effect);

        };


        ParticleSpawner.prototype.spawnActiveParticleEffect = function(id, pos, vel) {


            var effect = this.buildEffect(id, pos, vel);

            if (typeof(effect) == 'undefined') {
                console.log("Undefined effect created...", id, pos, vel);
                return;
            }
            fxAdds++;
            activeEffects.push(effect);
        };

        ParticleSpawner.prototype.updateActiveParticleEffect = function(effect, pos, state, tpf) {
            effect.updateEffectPositionSimulator(pos, tpf);
        };

        
        ParticleSpawner.prototype.spawnPassiveEffect = function(id, pos, vel, size, quat) {
            return this.buildEffect(id, pos, vel, size, quat);
        };

        ParticleSpawner.prototype.recoverPassiveEffect = function(effect) {

            if (typeof(effect) == 'undefined') {
                console.log("Undefined effect returned...")
                return;
            }

            if (!effect.aliveParticles.length) {
                console.log("Bad Effect returned!", effect);
                return;
            }

            effect.age = effect.lastTpf;

            activeEffects.push(effect);
        };


        ParticleSpawner.prototype.updateSpawnedParticles = function(tpf) {

            systemTime += tpf;

            for (var key in renderers) {
                for (var i = 0; i < renderers[key].length; i++) {
                    renderers[key][i].updateParticleRenderer(systemTime);
                }
            }

            while (endedEffects.length) {
                var dead = endedEffects.pop();
                var spliced = activeEffects.splice(activeEffects.indexOf(dead), 1)[0];
                spliced.resetParticleEffect();
                idleEffects.push(spliced);
            }


            for (var i = 0; i < activeEffects.length; i++) {

                if (typeof(activeEffects[i]) == 'undefined') {
                    console.log("Bad Effect pool handling,", activeEffects);
                    activeEffects.splice(activeEffects.indexOf(dead), 1)[0];
                    return;
                }

            }


            for (var i = 0; i < activeEffects.length; i++) {


                if (activeEffects[i].aliveParticles.length != 0) {
                    activeEffects[i].updateEffect(tpf, systemTime);
                } else {
                    // list for removal here...
                    endedEffects.push(activeEffects[i]);
                }
            }


        };

        
        
        ParticleSpawner.prototype.getTotalParticlePool = function() {
            var poolTotal = 0;
            
            for (var key in renderers) {
                for (var i = 0; i < renderers[key].length; i++) {
                    poolTotal += renderers[key][i].particles.length;
                }


            }

            return poolTotal;
        };

        ParticleSpawner.prototype.getTotalEffectPool = function() {
            return idleEffects.length;
        };

        var activeRenderes = 0;
        var totalRenderers = 0;

        ParticleSpawner.prototype.getActiveRendererCount = function() {
            return activeRenderes+' / '+totalRenderers ;
        };
        
        ParticleSpawner.prototype.getActiveEffectsCount = function() {
            return activeEffects.length;
        };

        ParticleSpawner.prototype.getActiveParticlesCount = function() {

            var count = 0;
            activeRenderes = 0;
            totalRenderers = 0;

            for (var i = 0; i < activeEffects.length; i++) {
                count += activeEffects[i].aliveParticles.length;
            };
            
            
            for (var key in renderers) {
                for (var i = 0; i < renderers[key].length; i++) {
                    var activeParticles = renderers[key][i].poolSize - renderers[key][i].particles.length;
                    if (activeParticles) {
                        if (!renderers[key][i].isRendering) {
                            renderers[key][i].enableParticleRenderer();
                        }
                        activeRenderes++;
                    } else {
                        if (renderers[key][i].isRendering) {
                            renderers[key][i].disableParticleRenderer();
                        }
                    }

                    totalRenderers++
                }
            }
            return count;
        };

        ParticleSpawner.prototype.getEffectActivationCount = function() {
            var adds = fxAdds;
            fxAdds = 0;
            return adds;
        };
        
        return ParticleSpawner;

    });
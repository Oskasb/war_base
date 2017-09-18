

"use strict";

define(['3d/effects/particles/EffectSimulators',
        '3d/effects/particles/ParticleParamParser'],
    function(EffectSimulators,
             ParticleParamParser
    ) {

        var calcVec = new THREE.Vector3();

        var ParticleEffect = function() {
            this.id = null;
            this.lastTpf = 0.016;

            this.effectDuration = 0;
            this.effectData = {};
            this.renderer = null;
            this.aliveParticles = [];
            this.size = new THREE.Vector3();
            this.pos = new THREE.Vector3();
            this.vel = new THREE.Vector3();
            this.quat = new THREE.Quaternion();
            this.deadParticles = [];

            this.dynamicSprite = null;

            this.temporary = {
                startTime:0,
                endTime:0
            };
        };

        ParticleEffect.prototype.setEffectTemporary = function(start, end) {
            this.temporary.startTime = start;
            this.temporary.endTime = end;
        };

        ParticleEffect.prototype.setEffectId = function(id) {
            this.id = id;
        };

        ParticleEffect.prototype.getEffectId = function() {
            return this.id;
        };

        ParticleEffect.prototype.resetParticleEffect = function() {
            this.dynamicSprite = null;
        };

        ParticleEffect.prototype.setEffectData = function(effectData) {
            this.effectData = effectData;
        };

        ParticleEffect.prototype.setEffectDuration = function(duration) {
            this.effectDuration = duration;
        };

        ParticleEffect.prototype.setEffectPosition = function(pos) {
            this.pos.x = pos.x;
            this.pos.y = pos.y;
            this.pos.z = pos.z;
        };

        ParticleEffect.prototype.setEffectQuaternion = function(quat) {
            this.quat.x = quat.x;
            this.quat.y = quat.y;
            this.quat.z = quat.z;
            this.quat.w = quat.w;
        };

        ParticleEffect.prototype.setEffectSize = function(size) {
            this.size.x = size.x;
            this.size.y = size.y;
            this.size.z = size.z;
        };

        ParticleEffect.prototype.setEffectVelocity = function(vel) {
            this.vel.x = vel.x;
            this.vel.y = vel.y;
            this.vel.z = vel.z;
        };

        ParticleEffect.prototype.attachSimulators = function() {
            var simulation = this.effectData.simulation;

            this.simulators = [];
            for (var i = 0; i < simulation.simulators.length; i++) {
                this.simulators.push(simulation.simulators[i])
            }
        };

        ParticleEffect.prototype.applyRenderer = function(renderer, systemTime) {
            this.renderer = renderer;
            this.age = 0;

            var idealCount = this.effectData.effect.count;
            var allowedCount = renderer.calculateAllowance(idealCount);

            var maxDuration = 0;

            for (var i = 0; i < allowedCount; i++) {
                var particle = renderer.requestParticle();
                this.includeParticle(particle, systemTime, i, allowedCount);
                this.aliveParticles.push(particle);
                if (particle.params.lifeTime.value > maxDuration) {
                    maxDuration = particle.params.lifeTime.value;
                    //    console.log(maxDuration)
                }
            }

            this.effectDuration = maxDuration + this.lastTpf;

        };

        var spreadVector = function(vec, spreadV4) {
            vec.x += spreadV4.x * (Math.random()-0.5);
            vec.y += spreadV4.y * (Math.random()-0.5);
            vec.z += spreadV4.z * (Math.random()-0.5);
        };

        ParticleEffect.prototype.includeParticle = function(particle, systemTime, index, allowedCount) {

            var frameTpfFraction = this.lastTpf*(index/allowedCount);

                ParticleParamParser.applyEffectParams(particle, this.effectData.gpuEffect.init_params);
                particle.posOffset.set(0, 0, 0);

                spreadVector(particle.posOffset, this.size);
                spreadVector(particle.posOffset, this.effectData.gpuEffect.positionSpread.vec4);

                particle.setQuaternion(this.quat);
                particle.setPosition(this.pos);
                particle.addPosition(particle.posOffset);


            ParticleParamParser.applyEffectSprite(particle, this.dynamicSprite || this.effectData.sprite);

            particle.initToSimulation(systemTime+frameTpfFraction, calcVec, this.vel);

            this.updateParticle(particle, frameTpfFraction);

        };

        ParticleEffect.prototype.applyParticleSimulator = function(simulator, particle, tpf) {
            EffectSimulators[simulator.process](
                particle,
                tpf,
                simulator.source,
                simulator.target
            );
        };

        ParticleEffect.prototype.updateEffectSpriteSimulator = function(sprite, spriteKey) {
            this.dynamicSprite = sprite;
            for (var i = 0; i < this.aliveParticles.length; i++) {
                ParticleParamParser.applyEffectSprite(this.aliveParticles[i], sprite);
                this.applyParticleSimulator(EffectSimulators.simulators.tiles, this.aliveParticles[i], 0)
            }
        };

        ParticleEffect.prototype.updateEffectPositionSimulator = function(pos, tpf) {

            for (var i = 0; i < this.aliveParticles.length; i++) {

                this.aliveParticles[i].setPosition(pos);
                this.aliveParticles[i].addPosition(this.aliveParticles[i].posOffset);

                this.applyParticleSimulator(EffectSimulators.simulators.position, this.aliveParticles[i], tpf)
            }
        };


        ParticleEffect.prototype.updateParticle = function(particle, tpf) {
            for (var i = 0; i < this.simulators.length; i++) {
                this.applyParticleSimulator(EffectSimulators.simulators[this.simulators[i]], particle, tpf)
            }
        };


        ParticleEffect.prototype.updateEffectAge = function(tpf) {
            this.age += tpf;
            this.lastTpf = tpf;
        };

        ParticleEffect.prototype.updateEffect = function(tpf, systemTime) {

            this.updateEffectAge(tpf);

            if (this.age > this.effectDuration) {
                for (var i = 0; i < this.aliveParticles.length; i++) {
                    EffectSimulators.dead(this.aliveParticles[i], tpf);
                    this.deadParticles.push(this.aliveParticles[i]);
                }
            } else {

                for (var i = 0; i < this.aliveParticles.length; i++) {
                    if (this.aliveParticles[i].dead) {
                        EffectSimulators.dead(this.aliveParticles[i], tpf);
                        this.deadParticles.push(this.aliveParticles[i]);

                        console.log("Legacy Fx update called...")

                    } else {
                        //    this.updateGpuParticle(this.aliveParticles[i], tpf)
                        if (this.aliveParticles[i].params.lifeTime.value < this.age + this.lastTpf * 2) {

                            console.log("Legacy Fx update called...")

                            EffectSimulators.dead(this.aliveParticles[i], tpf);
                            this.deadParticles.push(this.aliveParticles[i]);
                        }

                    }
                }
            }

            while (this.deadParticles.length) {
                var dead = this.deadParticles.pop();
                var spliced = this.aliveParticles.splice(this.aliveParticles.indexOf(dead), 1)[0];
                this.renderer.returnParticle(spliced);
            }
        };

        return ParticleEffect;
    });
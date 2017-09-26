"use strict";

define([
        'ThreeAPI',
        '3d/effects/particles/ParticleMaterial',
        '3d/effects/particles/ParticleMesh',
        '3d/effects/particles/ParticleBuffer',

        '3d/effects/particles/Particle',
        'PipelineObject'

    ],
    function(
        ThreeAPI,
        ParticleMaterial,
        ParticleMesh,
        ParticleBuffer,
        Particle,
        PipelineObject
    ) {

        var ParticleRenderer = function(rendererConfig, rendererReady) {
            this.id = rendererConfig.id;
            this.setupRendererMaterial(rendererConfig, rendererReady);
        };

        ParticleRenderer.prototype.setupRendererMaterial = function(rendererConfig, rendererReady) {

            this.isRendering = false;

            this.config = rendererConfig;
            this.poolSize = rendererConfig.particle_pool;
            this.particleGeometry = rendererConfig.particle_geometry;

            this.isScreenspace = rendererConfig.is_screenspace || false;
            this.renderOrder = rendererConfig.render_order || null;

            this.biggestRequest = 1;

            this.material = {uniforms:{}};
            this.particles = [];
            this.attributes = {};
            this.attributeConfigs = {};

            this.systemTime = 0;

            this.renderHighestIndex = 0;

            var particleMaterialData = function(src, data) {
    //            console.log("particleMaterialData", src, data);
                this.applyRendererMaterialData(data, rendererReady)
            }.bind(this);

            this.materialPipe = new PipelineObject("PARTICLE_MATERIALS", "THREE", particleMaterialData)
        };

        ParticleRenderer.prototype.setMaterial = function(material, rendererReady) {
            this.material = material;
            this.setupRendererBuffers(rendererReady);
        };

        ParticleRenderer.prototype.applyRendererMaterialData = function(data, rendererReady) {

            var materialReady = function(material) {
    //            console.log("MaterialReady", material);
               this.setMaterial(material, rendererReady);
            }.bind(this);

            for (var i = 0; i < data.length; i++) {
                if (data[i].id == this.config.material_id) {
    //                console.log("buildParticleMaterial", data[i].id );
                    this.setupBufferAttributes(data[i].attributes);
                    this.buildParticleMaterial(data[i], materialReady);
                }
            }
        };

        ParticleRenderer.prototype.setupRendererBuffers = function(rendererReady) {
            this.buildMeshBuffer();
            this.attachMaterial();
            this.createParticles(rendererReady);
        };

        ParticleRenderer.prototype.createParticles = function(rendererReady) {
            if (this.particles.length) {
                console.error("Replace added particles");
                this.particles = [];
            }

            for (var i = 0; i < this.poolSize; i++) {
                var particle = new Particle(i);
                for (var key in this.attributeConfigs) {
                    particle.bindAttribute(key, this.attributeConfigs[key].dimensions, this.attributes[key]);
                }
                this.particles.push(particle);
            }
            rendererReady(this);
        };

        ParticleRenderer.prototype.buildParticleMaterial = function(material_config, materialReady) {
            new ParticleMaterial(this.config.material_options, material_config, materialReady);
        };

        ParticleRenderer.prototype.buildMeshBuffer = function() {
            if (this.particleBuffer) {
                this.particleBuffer.dispose();
            }

            var geomCB = function(geom) {
                this.particleBuffer = new ParticleBuffer(geom.verts, geom.uvs, geom.indices, geom.normals);


                for (var key in this.attributes) {
                    this.particleBuffer.geometry.addAttribute( key, this.attributes[key] );
                }

                for (var key in this.particleBuffer.geometry.attributes) {
                    this.attributes[key] = this.particleBuffer.geometry.attributes[key];
                }


                this.particleBuffer.addToScene(this.isScreenspace);
                if (this.renderOrder) {
                    this.particleBuffer.mesh.renderOrder = this.renderOrder;
                }
            }.bind(this);


            if (typeof(this.particleGeometry) === 'string') {
                geomCB(ParticleMesh[this.particleGeometry]())
            } else  {
                ParticleMesh.modelGeometry(this.particleGeometry, geomCB)
            }


        //    this.particleBuffers.push(this.particleBuffer);
        };

        ParticleRenderer.prototype.attachMaterial = function() {
            this.particleBuffer.mesh.material = this.material;
        };

        ParticleRenderer.prototype.setupBufferAttributes = function(attributes_config) {
            for (var i = 0; i < attributes_config.length; i++) {
                var config = attributes_config[i];
                this.attributeConfigs[config.name] = config;
                var dimensions = config.dimensions;
                this.attributes[config.name] = new THREE.InstancedBufferAttribute(new Float32Array(this.poolSize * dimensions), dimensions, 1).setDynamic( config.dynamic );
            }
        };




        ParticleRenderer.prototype.calculateAllowance = function(requestSize) {

            if (this.biggestRequest < requestSize) {
                this.biggestRequest = requestSize;
            }

            if (this.particles.length - requestSize > this.biggestRequest) {
                return requestSize;
            } else {
                var req = Math.round( (this.poolSize / this.particles.length) * requestSize) || 1;
                if (this.particles.length > req) {
                    return  req;
                } else if (this.particles.length) {

                    return 1;
                }
                console.log("zero particles.. ", requestSize);
                return null;
            }
        };

        ParticleRenderer.prototype.requestParticle = function() {
            var particle = this.particles.shift();

            if (particle.particleIndex > this.renderHighestIndex) {
                this.renderHighestIndex = particle.particleIndex;
                this.particleBuffer.setInstancedCount( this.renderHighestIndex)
            }

            particle.dead = false;
            return particle;
        };


        ParticleRenderer.prototype.computerHighestRenderingIndex = function() {
            this.renderHighestIndex = this.particles.length;

            for (var i = 0; i < this.particles.length; i++) {
                if (this.particles[this.particles.length -i -1].particleIndex === this.renderHighestIndex) {
                    this.renderHighestIndex = this.particles[this.particles.length -i].particleIndex
                } else {
                    return this.particles[this.particles.length -i -1].particleIndex
                }
            }
        };


        ParticleRenderer.prototype.returnParticle = function(particle) {
            if (particle.particleIndex === this.renderHighestIndex) {

                this.renderHighestIndex = this.computerHighestRenderingIndex();

                this.particleBuffer.setInstancedCount( this.renderHighestIndex)
            }
            this.particles.unshift(particle);
        };


        ParticleRenderer.prototype.enableParticleRenderer = function() {
            this.isRendering = true;
            this.particleBuffer.addToScene(this.isScreenspace);
        };


        ParticleRenderer.prototype.disableParticleRenderer = function() {
            this.isRendering = false;
            this.particleBuffer.removeFromScene();
        };

        ParticleRenderer.prototype.applyUniformEnvironmentColor = function(uniform, worldProperty) {
            var color = ThreeAPI.readEnvironmentUniform(worldProperty, 'color');
            uniform.value.r = color.r;
            uniform.value.g = color.g;
            uniform.value.b = color.b;
        };


        ParticleRenderer.prototype.updateParticleRenderer = function(systemTime) {

            this.systemTime = systemTime;

            if (this.material.uniforms.systemTime) {
                this.material.uniforms.systemTime.value = this.systemTime;
            } else {
                console.log("no uniform yet...")
            }

            if (this.material.uniforms.fogColor) {
                this.applyUniformEnvironmentColor(this.material.uniforms.fogColor, 'fog')
            }

            if (this.material.uniforms.fogDensity) {
                this.material.uniforms.fogDensity.value = ThreeAPI.readEnvironmentUniform('fog', 'density');
            }

            if (this.material.uniforms.ambientLightColor) {
                this.applyUniformEnvironmentColor(this.material.uniforms.ambientLightColor, 'ambient');
            }

            if (this.material.uniforms.sunLightColor) {
                this.applyUniformEnvironmentColor(this.material.uniforms.sunLightColor, 'sun');
            }

        };

        ParticleRenderer.prototype.dispose = function() {
            this.particles = [];
            this.particleBuffer.dispose();
            this.materialPipe.removePipelineObject();
            delete this;
        };

        return ParticleRenderer;

    });
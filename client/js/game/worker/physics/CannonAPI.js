
"use strict";

define(['worker/physics/PhysicsFunctions'],

    function(PhysicsFunctions) {

        var CannonAPI = function() {

            this.physicsFunctions = new PhysicsFunctions();
            this.status = {
                bodyCount:0
            }
        };

        CannonAPI.prototype.initPhysics = function() {
            this.world = this.physicsFunctions.createPhysicalWorld()
        };

        CannonAPI.prototype.buildPhysicalTerrain = function(data, size, posx, posz, min_height, max_height) {
            return this.physicsFunctions.createPhysicalTerrain(this.world, data, size, posx, posz, min_height, max_height)
        };

        CannonAPI.prototype.setupPhysicalActor = function(actor) {
            return this.physicsFunctions.addPhysicalActor(this.world, actor);
        };

        CannonAPI.prototype.includeBody = function(body) {
            this.world.addBody(body);
        };

        CannonAPI.prototype.excludeBody = function(body) {
            this.world.removeBody(body);
        };

        CannonAPI.prototype.updatePhysicsSimulation = function(currentTime) {
            this.physicsFunctions.updatePhysicalWorld(this.world, currentTime)
        };
        
        CannonAPI.prototype.fetchPhysicsStatus = function() {
            if (Math.random() < 0.01) {
                console.log("BODIES:", this.world.bodies.length);
            }

            this.status.bodyCount = this.world.bodies.length;
            this.status.contactCount = this.world.contacts.length;

            return this.status;
        };

        return CannonAPI;

    });
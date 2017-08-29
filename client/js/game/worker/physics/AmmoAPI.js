
"use strict";

define(['worker/physics/AmmoFunctions'],

    function(AmmoFunctions) {

        var AmmoAPI = function() {

            this.ammoFunctions = new AmmoFunctions();
            this.status = {
                bodyCount:0
            }
        };

        AmmoAPI.prototype.initPhysics = function() {
            this.world = this.ammoFunctions.createPhysicalWorld()
        };


        AmmoAPI.prototype.buildPhysicalTerrain = function(data, size, posx, posz, min_height, max_height) {
            return this.ammoFunctions.createPhysicalTerrain(this.world, data, size, posx, posz, min_height, max_height)
        };


        AmmoAPI.prototype.setupPhysicalActor = function(actor) {
            return this.ammoFunctions.addPhysicalActor(this.world, actor);
        };

        AmmoAPI.prototype.includeBody = function(body) {
            this.world.addRigidBody(body);
        };

        AmmoAPI.prototype.excludeBody = function(body) {
            this.world.removeRigidBody(body);
        };


        AmmoAPI.prototype.updatePhysicsSimulation = function(currentTime) {
            this.ammoFunctions.updatePhysicalWorld(this.world, currentTime)
        };


        AmmoAPI.prototype.fetchPhysicsStatus = function() {
            if (Math.random() < 0.01) {
                console.log("BODIES:", this.world);
            }

        //    this.status.bodyCount = this.world.bodies.length;
        //    this.status.contactCount = this.world.contacts.length;

            return this.status;
        };

        return AmmoAPI;

    });
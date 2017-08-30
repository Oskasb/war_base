
"use strict";

define(['worker/physics/AmmoFunctions'],

    function(AmmoFunctions) {

        var ammoFunctions;

        var bodies = [];

        var status = {
            bodyCount:0
        };

        var AmmoAPI = function(Ammo) {

            ammoFunctions = new AmmoFunctions(Ammo);
        };

        AmmoAPI.prototype.initPhysics = function() {
            this.world = ammoFunctions.createPhysicalWorld()
        };


        AmmoAPI.prototype.buildPhysicalTerrain = function(data, size, posx, posz, min_height, max_height) {
            var body = ammoFunctions.createPhysicalTerrain(this.world, data, size, posx, posz, min_height, max_height);
            bodies.push(body);
            return body;
        };


        AmmoAPI.prototype.setupPhysicalActor = function(actor) {

            ammoFunctions.addPhysicalActor(this.world, actor);
            bodies.push(actor.getPhysicsBody());
            return actor;
        };

        AmmoAPI.prototype.includeBody = function(body) {
            if (bodies.indexOf(body) === -1) {
                bodies.push(body);
            }

            this.world.addRigidBody(body);
        };

        AmmoAPI.prototype.excludeBody = function(body) {
            bodies.splice(bodies.indexOf(body), -1);
            this.world.removeRigidBody(body);
        };


        AmmoAPI.prototype.updatePhysicsSimulation = function(currentTime) {
            ammoFunctions.updatePhysicalWorld(this.world, currentTime)
        };


        AmmoAPI.prototype.fetchPhysicsStatus = function() {
            if (Math.random() < 0.01) {
                console.log("BODIES:", bodies.length);
            }

        //    this.status.bodyCount = this.world.bodies.length;
        //    this.status.contactCount = this.world.contacts.length;

            return status;
        };

        return AmmoAPI;

    });
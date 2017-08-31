
"use strict";

define(['worker/physics/AmmoFunctions'],

    function(AmmoFunctions) {

        var AMMO = Ammo;

        var ammoFunctions;

        var bodies = [];

        var world;

        var STATE = {
            ACTIVE : 1,
            ISLAND_SLEEPING : 2,
            WANTS_DEACTIVATION : 3,
            DISABLE_DEACTIVATION : 4,
            DISABLE_SIMULATION : 5
        }

        var status = {
            bodyCount:0
        };

        var AmmoAPI = function() {
            ammoFunctions = new AmmoFunctions();

        };

        AmmoAPI.prototype.initPhysics = function(cb) {

            AMMO().then(function(ammo) {
                world = ammoFunctions.createPhysicalWorld(ammo);
                cb()
            });

        };

        AmmoAPI.prototype.cleanupPhysics = function() {

            while (bodies.length) {
                this.excludeBody(bodies[0], true)
            }

            world = ammoFunctions.cleanupPhysicalWorld(world)
        };

        AmmoAPI.prototype.buildPhysicalTerrain = function(data, size, posx, posz, min_height, max_height) {
            var body = ammoFunctions.createPhysicalTerrain(world, data, size, posx, posz, min_height, max_height);
            bodies.push(body);
            return body;
        };


        AmmoAPI.prototype.setupPhysicalActor = function(actor) {

            ammoFunctions.addPhysicalActor(world, actor);
            bodies.push(actor.getPhysicsBody());
            return actor;
        };

        AmmoAPI.prototype.includeBody = function(body) {
            if (bodies.indexOf(body) === -1) {
                bodies.push(body);
            }

            world.addRigidBody(body);
        };

        AmmoAPI.prototype.excludeBody = function(body, destroy) {
            var bi = bodies.indexOf(body);
            bodies.splice(bi, 1);

            if (!body) {
                console.log("No body", bi, body)
                return;
            }

            body.forceActivationState(STATE.DISABLE_SIMULATION);
        //    ammoFunctions.removeAmmoRigidBody(body, destroy);
        };


        AmmoAPI.prototype.updatePhysicsSimulation = function(currentTime) {
            ammoFunctions.updatePhysicalWorld(world, currentTime)
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
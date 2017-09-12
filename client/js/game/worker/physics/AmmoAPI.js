
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

            AMMO().then(function(ammo) {
            ammoFunctions = new AmmoFunctions(ammo);
            });

        };

        AmmoAPI.prototype.initPhysics = function() {
            world = ammoFunctions.createPhysicalWorld();
        };

        AmmoAPI.prototype.getYGravity = function() {
            return ammoFunctions.getYGravity();
        };

        AmmoAPI.prototype.cleanupPhysics = function(cb) {

            while (bodies.length) {
                this.excludeBody(bodies[0], true)
            }

            world = null;
            ammoFunctions.cleanupPhysicalWorld(cb);
        };

        AmmoAPI.prototype.buildPhysicalTerrain = function(data, size, posx, posz, min_height, max_height) {
            var body = ammoFunctions.createPhysicalTerrain(world, data, size, posx, posz, min_height, max_height);
            bodies.push(body);
            return body;
        };


        AmmoAPI.prototype.setupPhysicalActor = function(actor) {

            ammoFunctions.addPhysicalActor(world, actor);
            bodies.push(actor.getPhysicsBody());
            world.addRigidBody(actor.getPhysicsBody());
            return actor;
        };

        AmmoAPI.prototype.includeBody = function(body) {
            if (!body) {
                console.log("Cant add !body", body);
                return;
            }
            if (bodies.indexOf(body) === -1) {
                bodies.push(body);
            }

            ammoFunctions.enableBodySimulation(body);
        };

        AmmoAPI.prototype.disableActorPhysics = function(actor) {
        //    console.log("disableActorPhysics body", actor);
            var body = actor.getPhysicsBody();

            if (!body) {
                console.log("No body", actor, body);
                return;
            }

            var dataKey = actor.physicalPiece.dataKey;
            this.excludeBody(body, dataKey);
        };


        AmmoAPI.prototype.excludeBody = function(body, dataKey) {
            var bi = bodies.indexOf(body);
            bodies.splice(bi, 1);

            if (!body) {
                console.log("No body", bi, body);
                return;
            }

            ammoFunctions.disableBodySimulation(body);
        };


        AmmoAPI.prototype.updatePhysicsSimulation = function(currentTime) {
            ammoFunctions.updatePhysicalWorld(world, currentTime)
        };


        AmmoAPI.prototype.raycastPhysicsWorld = function(position, direction, hitPositionStore, hitNormalStore) {
            var hit = ammoFunctions.physicsRayRange(world, position, direction, hitPositionStore, hitNormalStore);
            if (hit) {
                return hit.ptr;
            }
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
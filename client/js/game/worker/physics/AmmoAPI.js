
"use strict";

define(['worker/physics/AmmoFunctions'],

    function(AmmoFunctions) {

        var AmmoAPI = function() {

            console.log("Ammo", new Ammo.btVector3(0, 1, 0));


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

        AmmoAPI.prototype.attachPiecePhysics = function(piece) {

            if (piece.physics.rigid_body) {
//        console.log("PiecePhysics", piece.id, piece.physics.rigid_body, piece.spatial)
                piece.physics.body =  this.buildRigidBody(piece.spatial, piece.physics.rigid_body);

            } else {
                console.log("No body on this!")
            }
        };

        AmmoAPI.prototype.setupPhysicalActor = function(actor) {
            return this.ammoFunctions.addPhysicalActor(this.world, actor);
        };

        AmmoAPI.prototype.includeBody = function(body) {
            this.world.addBody(body);
        };

        AmmoAPI.prototype.excludeBody = function(body) {
            this.world.removeBody(body);
        };


        AmmoAPI.prototype.removePhysicsPiece = function(piece) {
            console.log("REMOVE RIGID BODY:", piece.physics.rigid_body);
            this.world.removeBody(piece.physics.body);
        };

        AmmoAPI.prototype.updatePhysicalPiece = function(piece) {
            this.ammoFunctions.applyBodyToSpatial(piece);
        };

        AmmoAPI.prototype.updatePhysicsSimulation = function(currentTime) {
            this.ammoFunctions.updatePhysicalWorld(this.world, currentTime)
        };


        AmmoAPI.prototype.fetchPhysicsStatus = function() {
            if (Math.random() < 0.01) {
                console.log("BODIES:", this.world.bodies.length);
            }

            this.status.bodyCount = this.world.bodies.length;
            this.status.contactCount = this.world.contacts.length;

            return this.status;
        };

        return AmmoAPI;

    });

"use strict";

define([
        'worker/physics/AmmoVehicle',
        'worker/physics/AmmoHovercraft',
        'three/ThreeModelLoader',
    'worker/physics/BodyPool'
    ],
    function(
        AmmoVehicle,
        AmmoHovercraft,
        ThreeModelLoader,
        BodyPool
    ) {

        var threeVec;
        var threeEuler;
        var threeEuler2;
        var threeObj;
        var threeObj2;

        var MATHVec3;
        var TRANSFORM_AUX;
        var QUAT_AUX;
        var VECTOR_AUX;

        var rayCallback;
        var rayFromVec;
        var rayToVec;

        var Ammo;


        var STATE = {
            ACTIVE : 1,
            ISLAND_SLEEPING : 2,
            WANTS_DEACTIVATION : 3,
            DISABLE_DEACTIVATION : 4,
            DISABLE_SIMULATION : 5
        };

        var COLLISION_FLAGS = {
            CF_STATIC_OBJECT:1,
            CF_KINEMATIC_OBJECT:2,
            CF_NO_CONTACT_RESPONSE:4,
            CF_CUSTOM_MATERIAL_CALLBACK:8,
            CF_CHARACTER_OBJECT:16,
            CF_DISABLE_VISUALIZE_OBJECT:32,
            CF_DISABLE_SPU_COLLISION_PROCESSING:64};

        var shapes = [];
        var bodyPools = {};

        var AmmoFunctions = function(ammo) {

            Ammo = ammo;


            rayFromVec = new Ammo.btVector3();
            rayToVec = new Ammo.btVector3();

            rayCallback = new Ammo.ClosestRayResultCallback(rayFromVec, rayToVec);


            TRANSFORM_AUX = new Ammo.btTransform();
            VECTOR_AUX = new Ammo.btVector3();

            QUAT_AUX = new Ammo.btQuaternion();

            MATHVec3 = new MATH.Vec3();
            threeVec = new THREE.Vector3();
            threeObj = new THREE.Object3D();
            threeObj2 = new THREE.Object3D();
            threeQuat = new THREE.Quaternion();
            threeEuler = new THREE.Euler(0, 0, 0, 'XZY');
            threeEuler2 = new THREE.Euler();
            this.calcVec = new CANNON.Vec3();
            this.calcVec2 = new CANNON.Vec3();

        };

        var lastTime;

        var DISABLE_DEACTIVATION = 4;
        var ZERO_QUATERNION = new THREE.Quaternion(0, 0, 0, 1);

        var materialDynamic, materialStatic, materialInteractive;

        var currentTime;

        var groundMaterial;
        var propMaterial;
        var chassisMaterial;
        var propGroundContactMaterial;
        var groundPropContactMaterial;
        var chassisGroundContactMaterial;

        var threeQuat;

        // Physics variables
        var collisionConfiguration;
        var dispatcher;
        var broadphase;
        var solver;
        var physicsWorld;


        var fixedTimeStep = 1.0 / 60.0; // seconds
        var maxSubSteps = 5;
// Global settings
        var settings = {
            stepFrequency: 60,
            quatNormalizeSkip: 2,
            quatNormalizeFast: true,
            gx: 0,
            gy: 0,
            gz: 0,
            iterations: 3,
            tolerance: 0.0001,
            k: 1e6,
            d: 3,
            scene: 0,
            paused: false,
            rendermode: "solid",
            constraints: false,
            contacts: false,  // Contact points
            cm2contact: false, // center of mass to contact points
            normals: false, // contact normals
            axes: false, // "local" frame axes
            particleSize: 0.1,
            shadows: false,
            aabbs: false,
            profiling: false,
            maxSubSteps:3
        };

        var gravity = -9.81;

        AmmoFunctions.prototype.getYGravity = function() {
            return gravity;
        }

        AmmoFunctions.prototype.createPhysicalWorld = function() {
            //   Ammo = ammo;
            collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
            dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
            broadphase = new Ammo.btDbvtBroadphase();
            solver = new Ammo.btSequentialImpulseConstraintSolver();
            physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
            physicsWorld.setGravity( new Ammo.btVector3( 0, gravity, 0 ) );


            return physicsWorld;
        };


        var disable = function(body) {
            setTimeout(function() {
                body.forceActivationState(STATE.DISABLE_SIMULATION);
            }, 500)
        }



        AmmoFunctions.prototype.forceAndTorqueToBody = function(forceVec3, body, torqueVec) {


            if (forceVec3) {
                VECTOR_AUX.setX(forceVec3.x);
                VECTOR_AUX.setY(forceVec3.y);
                VECTOR_AUX.setZ(forceVec3.z);

                body.applyCentralForce(VECTOR_AUX);
            }

            if (torqueVec) {
                VECTOR_AUX.setX(torqueVec.x );
                VECTOR_AUX.setY(torqueVec.y );
                VECTOR_AUX.setZ(torqueVec.z );

                body.applyLocalTorque(VECTOR_AUX);
            }

        };


        AmmoFunctions.prototype.applyForceToBodyWithMass = function(forceVec3, body, mass, randomize) {
            body.activate();
            body.forceActivationState(STATE.ACTIVE);

            var randomFactor = randomize || 0.01;

            var massFactor = 5000 * Math.sqrt(mass/3) + mass*150;

            forceVec3.multiplyScalar(massFactor);

            body.forceActivationState(STATE.ACTIVE);

            VECTOR_AUX.setX(forceVec3.x + forceVec3.x * (Math.random() - 0.5) * randomFactor);
            VECTOR_AUX.setY(forceVec3.y + forceVec3.y * (Math.random() - 0.5) * randomFactor);
            VECTOR_AUX.setZ(forceVec3.z + forceVec3.z * (Math.random() - 0.5) * randomFactor);

            body.applyCentralForce(VECTOR_AUX);

            VECTOR_AUX.setX(forceVec3.x * randomFactor + (Math.random() - 0.5) * massFactor*0.1 * randomFactor);
            VECTOR_AUX.setY(forceVec3.y * randomFactor * 0.1 + (Math.random() - 0.5) * massFactor*0.01 * randomFactor);
            VECTOR_AUX.setZ(forceVec3.z * randomFactor + (Math.random() - 0.5) * massFactor*0.1 * randomFactor);

            body.applyTorque(VECTOR_AUX);

        };

        AmmoFunctions.prototype.getBodyActiveState = function(body) {
            return body.isActive()
        };

        AmmoFunctions.prototype.enableBodySimulation = function(body) {
            body.activate();
            body.forceActivationState(STATE.ACTIVE);
        };


        AmmoFunctions.prototype.relaxBodySimulation = function(body) {
        //    body.deactivate();

            if (!this.getBodyActiveState(body)) {
            //    this.disableBodySimulation(body);
                return;
            }

            body.forceActivationState(STATE.WANTS_DEACTIVATION);

        //    return;
            body.getLinearVelocity(VECTOR_AUX);

            var speed = Math.abs(VECTOR_AUX.x()) + Math.abs(VECTOR_AUX.y()) + Math.abs(VECTOR_AUX.z());

            if (speed > 2) return;

            body.getAngularVelocity(VECTOR_AUX);

            var spin = Math.abs(VECTOR_AUX.x()) + Math.abs(VECTOR_AUX.y()) + Math.abs(VECTOR_AUX.z());

            if (spin+speed < 0.5) {
                this.disableBodySimulation(body);
            }

        };

        AmmoFunctions.prototype.disableBodySimulation = function(body) {
            body.forceActivationState(STATE.DISABLE_SIMULATION);
        };

        var hit = {
            fraction:0,
            normal:null,
            ptr:null
        };


        AmmoFunctions.prototype.physicsRayRange = function(world, pos, dir, posRes, normalRes) {

            rayFromVec.setX(pos.x);
            rayFromVec.setY(pos.y);
            rayFromVec.setZ(pos.z);

            rayToVec.setX(dir.x);
            rayToVec.setY(dir.y);
            rayToVec.setZ(dir.z);

            rayCallback.get_m_rayFromWorld().setValue(pos.x, pos.y, pos.z);
            rayCallback.get_m_rayToWorld().setValue(dir.x, dir.y, dir.z);
            rayCallback.set_m_collisionObject(null);

            rayCallback.get_m_hitNormalWorld().setX(0);
            rayCallback.get_m_hitNormalWorld().setY(0);
            rayCallback.get_m_hitNormalWorld().setZ(0);
            rayCallback.get_m_hitPointWorld().setX(0);
            rayCallback.get_m_hitPointWorld().setY(0);
            rayCallback.get_m_hitPointWorld().setZ(0);

            world.rayTest(rayFromVec, rayToVec, rayCallback);

            if(rayCallback.hasHit()){

                var hitNormal = rayCallback.get_m_hitNormalWorld();
                normalRes.set(hitNormal.x(), hitNormal.y(), hitNormal.z());
                var hitPoint = rayCallback.get_m_hitPointWorld();
                posRes.set(hitPoint.x(), hitPoint.y(), hitPoint.z());

                hit.ptr = rayCallback.get_m_collisionObject().a;

            //    console.log(hitPoint, hit.ptr);
                return hit;
            }

        };


        AmmoFunctions.prototype.cleanupPhysicalWorld = function(cb) {

            var shapeCount = shapes.length;

            while (shapes.length) {
                Ammo.destroy(shapes.pop())
            }

            Ammo.destroy(physicsWorld);
            Ammo.destroy(solver);
            Ammo.destroy(broadphase);
            Ammo.destroy(dispatcher);
            Ammo.destroy(collisionConfiguration);

            for (var key in bodyPools) {
                bodyPools[key].wipePool();
            }

            bodyPools = {};

            cb(shapeCount)
        };

        var remaining = 0;
        var MODEL = {};

        MODEL.PhysicsStepTime = 0.05;
        MODEL.PhysicsMaxSubSteps = 2;
        MODEL.SpatialTolerance = 1;
        MODEL.AngularVelocityTolerance = 1;
        MODEL.TemporalTolerance = 1;

        AmmoFunctions.prototype.updatePhysicalWorld = function(world, currentTime) {

            if(lastTime !== undefined){
                var dt = (currentTime - lastTime);

                remaining = dt + remaining;

                while (remaining >= 0) {

                    world.stepSimulation(MODEL.PhysicsStepTime , MODEL.PhysicsMaxSubSteps, MODEL.PhysicsStepTime);

                    remaining -= MODEL.PhysicsStepTime;
                }
            }
            //   console.log("Sphere xyz position: "+ sphereBody.position.x +' _ '+ sphereBody.position.y+' _ '+ sphereBody.position.z);
            lastTime = currentTime;

        };


        function createTerrainShape(data, sideSize, terrainMaxHeight, terrainMinHeight) {

            var terrainWidthExtents = sideSize;
            var terrainDepthExtents = sideSize;
            var terrainWidth = Math.sqrt(data.length);
            var terrainDepth = terrainWidth;
            var terrainHalfWidth = terrainWidth / 2;
            var terrainHalfDepth = terrainDepth / 2;

            var heightScale = 1;
            // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
            var upAxis = 1;
            // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
            var hdt = "PHY_FLOAT";
            // Set this to your needs (inverts the triangles)
            var flipQuadEdges = false;
            // Creates height data buffer in Ammo heap
            var ammoHeightData = Ammo._malloc(4 * terrainWidth * terrainDepth);
            // Copy the javascript height data array to the Ammo one.
            var p = 0;
            var p2 = 0;
            //    for (var j = 0; j < terrainWidth; j++) {
            for (var i = 0; i < data.length; i++) {
                // write 32-bit float data to memory
                Ammo.HEAPF32[ammoHeightData + p2 >> 2] = data[i];
                p++;
                // 4 bytes/float
                p2 += 4;
            }
            //    }
            // Creates the heightfield physics shape
            var heightFieldShape = new Ammo.btHeightfieldTerrainShape(
                terrainWidth,
                terrainDepth,
                ammoHeightData,
                heightScale,
                terrainMinHeight,
                terrainMaxHeight,
                upAxis,
                hdt,
                flipQuadEdges
            );
            // Set horizontal scale
            var scaleX = terrainWidthExtents / ( terrainWidth - 1 );
            var scaleZ = terrainDepthExtents / ( terrainDepth - 1 );
            heightFieldShape.setLocalScaling(new Ammo.btVector3(scaleX, 1, scaleZ));
            heightFieldShape.setMargin(0.05);
            return heightFieldShape;
        }


        AmmoFunctions.prototype.createPhysicalTerrain = function(world, data, totalSize, posx, posz, minHeight, maxHeight) {

            var terrainMaxHeight = maxHeight;
            var terrainMinHeight = minHeight;

            var heightDiff = maxHeight-minHeight;

            var restitution =  0.01;
            var damping     =  8.0;
            var friction    =  2.0;

            //    console.log("Ground Matrix: ", data.length)

            var groundShape = createTerrainShape( data, totalSize, terrainMaxHeight, terrainMinHeight );
            shapes.push(groundShape);
            var groundTransform = new Ammo.btTransform();
            groundTransform.setIdentity();
            // Shifts the terrain, since bullet re-centers it on its bounding box.
            groundTransform.setOrigin( new Ammo.btVector3(posx, minHeight + (heightDiff) * 0.5 ,posz) );
            var groundMass = 0;
            var groundLocalInertia = new Ammo.btVector3( 0, 0, 0 );
            var groundMotionState = new Ammo.btDefaultMotionState( groundTransform );

            var rbInfo = new Ammo.btRigidBodyConstructionInfo( groundMass, groundMotionState, groundShape, groundLocalInertia )
            rbInfo.set_m_linearSleepingThreshold(0);
            rbInfo.set_m_angularSleepingThreshold(0);

            var groundBody = new Ammo.btRigidBody(rbInfo);

            groundBody.setWorldTransform(groundTransform);

            groundBody.setRestitution(restitution);
            groundBody.setFriction(friction);
            groundBody.setDamping(damping, damping);

            world.addRigidBody( groundBody );

            return groundBody;
        };

        var reset = function(body, params) {
            applyBodyParams(body, params)
        };


        var resetMass = function(body, conf) {
            setTimeout(function() {
                reset(body, conf);
            }, 500)
        };

        function setBodyTransform(conf, body, position, quaternion) {



            var ms = body.getMotionState();

        //    ms.getWorldTransform(TRANSFORM_AUX);

        //    body.clearForces();

            TRANSFORM_AUX.setIdentity();

            TRANSFORM_AUX.getOrigin().setX(position.x);
            TRANSFORM_AUX.getOrigin().setY(position.y);
            TRANSFORM_AUX.getOrigin().setZ(position.z);


        //    body.getWorldTransform(TRANSFORM_AUX);


            QUAT_AUX.setX(quaternion.x);
            QUAT_AUX.setY(quaternion.y);
            QUAT_AUX.setZ(quaternion.z);
            QUAT_AUX.setW(quaternion.w);

 /*
            TRANSFORM_AUX.getRotation().setX(quaternion.x);
            TRANSFORM_AUX.getRotation().setY(quaternion.y);
            TRANSFORM_AUX.getRotation().setZ(quaternion.z);
            TRANSFORM_AUX.getRotation().setW(quaternion.w);
        */


            TRANSFORM_AUX.setRotation(QUAT_AUX);

        //    body.setWorldTransform(TRANSFORM_AUX);

        //    ms.setWorldTransform(TRANSFORM_AUX);

        body.setWorldTransform(TRANSFORM_AUX);

        body.getMotionState().setWorldTransform(TRANSFORM_AUX);


            VECTOR_AUX.setX(0);
            VECTOR_AUX.setY(0);
            VECTOR_AUX.setZ(0);

            body.getLinearVelocity().setX(0);
            body.getLinearVelocity().setY(0);
            body.getLinearVelocity().setZ(0);

            body.getAngularVelocity().setX(0);
            body.getAngularVelocity().setY(0);
            body.getAngularVelocity().setZ(0);

            applyBodyParams(body, conf);
            return;

            /*

            body.setLinearVelocity(VECTOR_AUX);


            body.setAngularVelocity(VECTOR_AUX);
            */

        //    body.setMassProps(conf.mass, VECTOR_AUX);
        //    body.setDamping(conf.mass, VECTOR_AUX);

            body.setRestitution(0);
            body.setFriction(9);
            body.setDamping(9, 9);

            resetMass(body, conf)

        };



        function fetchPoolBody(dataKey) {
            if (!bodyPools[dataKey]) {
                return;
            } else {
                return bodyPools[dataKey].getFromPool();
            }
        }



        AmmoFunctions.prototype.addPhysicalActor = function(world, actor) {
            var conf = actor.physicalPiece.config;

            var rigid_body = conf.rigid_body;

            var args = rigid_body.args;

            var dataKey = actor.physicalPiece.dataKey;
            var shapeKey = conf.shape;

            var position = actor.piece.rootObj3D.position;
            var quaternion = actor.piece.rootObj3D.quaternion;

            var rigidBody;

            if (shapeKey === "terrain") {
                return;
            }

            if (shapeKey === "primitive") {

                var createFunc = function(physicsShape) {
                    return createPrimitiveBody(world, physicsShape, rigid_body);
                };

                rigidBody = fetchPoolBody(dataKey);
                if (!rigidBody) {

                    var shape = createPrimitiveShape(rigid_body);

                    bodyPools[dataKey] = new BodyPool(shape, createFunc);
                    rigidBody = fetchPoolBody(dataKey);
                } else {
                    rigidBody.forceActivationState(STATE.ACTIVE);
                }

                position.y += args[2] / 2;

                setBodyTransform(rigid_body, rigidBody, position, quaternion);
            }

            if (shapeKey === "vehicle") {
                var ammoVehicle = new AmmoVehicle(world, conf.rigid_body, position, quaternion);

                actor.piece.processor = ammoVehicle.processor;
                rigidBody = ammoVehicle.body;
                actor.piece.vehicle = ammoVehicle.vehicle;
            }

            if (shapeKey === "hovercraft") {
                var ammoVehicle = new AmmoHovercraft(world, conf.rigid_body, position, quaternion);

                actor.piece.processor = ammoVehicle.processor;
                rigidBody = ammoVehicle.body;
                actor.piece.hovercraft = ammoVehicle;
            }



            if (shapeKey === "mesh") {
                rigidBody = createMeshBody(world, conf.rigid_body, position, quaternion);
            }

            actor.setPhysicsBody(rigidBody);

            world.addRigidBody(rigidBody);

            return actor;

        };


        function createBody(geometry, mass) {

            if(!mass) mass = 0;

            var transform = new Ammo.btTransform();
            transform.setIdentity();
            var motionState = new Ammo.btDefaultMotionState(transform);
            var localInertia = new Ammo.btVector3(0, 0, 0);
            geometry.calculateLocalInertia(mass, localInertia);



            var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, geometry, localInertia);

            if (mass) {
                rbInfo.set_m_linearSleepingThreshold(1.0);
                rbInfo.set_m_angularSleepingThreshold(0.40);
            }


            var body = new Ammo.btRigidBody(rbInfo);

            return body;
        }

        function ammoBoxShape(w, h, l) {
            return new Ammo.btBoxShape(new Ammo.btVector3(w * 0.5, h * 0.5, l * 0.5));
        }

        function ammoCylinderShape(w, h, l) {
            return new Ammo.btCylinderShape(new Ammo.btVector3(w * 0.5, l * 0.5, h * 1));
        }

        function createConvexHullFromBuffer(buffer) {
            var btConvexHullShape = new Ammo.btConvexHullShape();
            var _vec3_1 = new Ammo.btVector3(0,0,0);
            var _vec3_2 = new Ammo.btVector3(0,0,0);
            var _vec3_3 = new Ammo.btVector3(0,0,0);
            for (var i = 0; i < buffer.length; i+=9 ) {
                _vec3_1.setX(buffer[i+0]);
                _vec3_1.setY(buffer[i+1]);
                _vec3_1.setZ(buffer[i+2]);
                _vec3_2.setX(buffer[i+3]);
                _vec3_2.setY(buffer[i+4]);
                _vec3_2.setZ(buffer[i+5]);
                _vec3_3.setX(buffer[i+6]);
                _vec3_3.setY(buffer[i+7]);
                _vec3_3.setZ(buffer[i+8]);

                btConvexHullShape.addPoint(_vec3_1,true);
                btConvexHullShape.addPoint(_vec3_2,true);
                btConvexHullShape.addPoint(_vec3_3,true);
            }
            return btConvexHullShape;
        }

        function createTriMeshFromBuffer(buffer) {
            var triangle_mesh = new Ammo.btTriangleMesh;
            var _vec3_1 = new Ammo.btVector3(0,0,0);
            var _vec3_2 = new Ammo.btVector3(0,0,0);
            var _vec3_3 = new Ammo.btVector3(0,0,0);
            for (var i = 0; i < buffer.length; i+=9 ) {
                _vec3_1.setX(buffer[i+0]);
                _vec3_1.setY(buffer[i+1]);
                _vec3_1.setZ(buffer[i+2]);
                _vec3_2.setX(buffer[i+3]);
                _vec3_2.setY(buffer[i+4]);
                _vec3_2.setZ(buffer[i+5]);
                _vec3_3.setX(buffer[i+6]);
                _vec3_3.setY(buffer[i+7]);
                _vec3_3.setZ(buffer[i+8]);
                triangle_mesh.addTriangle(
                    _vec3_1,
                    _vec3_2,
                    _vec3_3,
                    true
                );
            }
            return new Ammo.btBvhTriangleMeshShape( triangle_mesh, true, true );
        }


        function createMeshShape(model_id, convex) {

            var modelPool = ThreeModelLoader.getModelPool();

            var mesh = modelPool[model_id][0];

            if (mesh.shape) {
                return mesh.shape;
            }

            var geometry = mesh.geometry;

            if (convex) {
                mesh.shape = createConvexHullFromBuffer(geometry.attributes.position.array);
            } else {
                mesh.shape = createTriMeshFromBuffer(geometry.attributes.position.array);
            }

            console.log("create mesh shape", mesh);

            return mesh.shape;
        }

        var createMeshBody = function(world, bodyParams, position, quaternion) {
            var args = bodyParams.args;

            var heightOffset = 0;

            var mass = bodyParams.mass;

            var friction = bodyParams.friction || 2.9;

            var shape = createMeshShape(bodyParams.model_id, bodyParams.convex);

            //    heightOffset = args[2] / 2;


            if (!mass) {
                heightOffset = 0;
            }

            threeVec.y += heightOffset;

            shape.setMargin(0.05);

            if(!mass) mass = 0;

            var transform = new Ammo.btTransform();
            transform.setIdentity();

            transform.getOrigin().setX(position.x);
            transform.getOrigin().setY(position.y);
            transform.getOrigin().setZ(position.z);

            var motionState = new Ammo.btDefaultMotionState(transform);
            var localInertia = new Ammo.btVector3(0, 0, 0);

            var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
            var body = new Ammo.btRigidBody(rbInfo);

            body.getWorldTransform(transform);

            QUAT_AUX.setX(quaternion.x);
            QUAT_AUX.setY(quaternion.y);
            QUAT_AUX.setZ(quaternion.z);
            QUAT_AUX.setW(quaternion.w);

            transform.setRotation(QUAT_AUX);

            body.setWorldTransform(transform);
            body.getMotionState().setWorldTransform(transform);

        //    var body = createBody(shape, mass);
                        //    body.setActivationState(DISABLE_DEACTIVATION);
            return body;

        };

        var createPrimitiveShape = function(bodyParams) {
            var args = bodyParams.args;

            var shape;

            if (bodyParams.shape === 'Cylinder') {
                shape = ammoCylinderShape(args[0], args[1], args[2]);

            }

            if (bodyParams.shape === 'Box') {
                shape = ammoBoxShape(args[0], args[1], args[2]);
                //    shape = new CANNON[bodyParams.shape](new CANNON.Vec3(args[2],args[0],args[1]));
            }

            shapes.push(shape);
            return shape;

        };


        var applyBodyParams = function(body, bodyParams) {

            var restitution = bodyParams.restitution || 0.5;
            var damping = bodyParams.damping || 0.5;
            var friction = bodyParams.friction || 2.9;
            body.setRestitution(restitution);
            body.setFriction(friction);
            body.setDamping(damping, damping);

            if (bodyParams.angular_factor) {
                var af = bodyParams.angular_factor;

                var angFac = new Ammo.btVector3();

                angFac.setX(af[0]);
                angFac.setY(af[1]);
                angFac.setZ(af[2]);

                body.setAngularFactor(angFac);
            }

            if (bodyParams.linear_factor) {
                var lf = bodyParams.linear_factor;

                var linFac = new Ammo.btVector3();

                linFac.setX(lf[0]);
                linFac.setY(lf[1]);
                linFac.setZ(lf[2]);

                body.setLinearFactor(linFac);
            }



            //    body.forceActivationState(STATE.WANTS_DEACTIVATION);
        };

        var createPrimitiveBody = function(world, shape, bodyParams) {
            var mass = bodyParams.mass || 0;
            var body = createBody(shape, mass);

            //    applyBodyParams(body, bodyParams);

            if (bodyParams.state) {
                body.forceActivationState(STATE[bodyParams.state]);
            }

        //
            return body;

        };



        return AmmoFunctions;

    });




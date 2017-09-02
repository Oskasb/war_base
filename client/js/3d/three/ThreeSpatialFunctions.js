"use strict";


define([
    'ui/GameScreen'
], function(
    GameScreen
) {

    var calcVec = new THREE.Vector3();
    var calcVec2 = new THREE.Vector3();
    var pointerFrustumPos = new THREE.Vector3();
    var frustumCoordinates = new THREE.Vector3(0, 0, 0);
    var hoverCoords = new THREE.Vector3(0, 0, 0);
    var distsq

    var fitView = function(vec3) {
        vec3.x *= 0.84 * GameScreen.getAspect();
        vec3.v *= -0.84
        vec3.z = 0;
    };

    var ThreeSpatialFunctions = function() {

    };


    ThreeSpatialFunctions.prototype.getHoverDistanceToPos = function(pos, mouseState) {

        pointerFrustumPos.set(
            ((mouseState.x-GameScreen.getLeft()) / GameScreen.getWidth() - 0.5),
            -((mouseState.y-GameScreen.getTop()) / GameScreen.getHeight()) + 0.5,
            0
        );

        fitView(pos);

        distsq = pos.distanceToSquared(pointerFrustumPos);

        return distsq;

    };



    return ThreeSpatialFunctions;

});
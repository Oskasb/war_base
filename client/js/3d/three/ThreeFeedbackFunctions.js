"use strict";


define([

], function(

) {



    var getMaterial = function(model) {
        return model.userData.animMat;
    };

    var ThreeFeedbackFunctions = function() {

    };

    var setupMaterial = function(model) {

            var map =  model.children[0].material.map.clone();
            map.version = model.children[0].material.map.version;
            model.children[0].material = model.children[0].material.clone();
            model.children[0].material.map = map;
            model.userData.animMat = model.children[0].material;

        //    model.children[0].material = model.userData.animMat;
    };

    var applyToTextures = function(material, x, y, cumulative) {

        material.polygonOffsetFactor = Math.random();
        material.polygonOffsetUnits  = 1;

        material.map.offset.x = x + (material.map.offset.x * cumulative);
        material.map.offset.y = y + (material.map.offset.y * cumulative);
        material.needsUpdate = true;

    };


    ThreeFeedbackFunctions.applyModelTextureTranslation = function(model, x, y, cumulative) {

        x = x || 0;
        y = y || 0;

        if (!model) return;

    //    if (cumulative) console.log(cumulative)
        var mat = getMaterial(model);
        if (!mat) {
            setupMaterial(model);
            console.log("No material", model);
            return;
        }

        applyToTextures(model.userData.animMat, x, y, cumulative);
    };

    return ThreeFeedbackFunctions;

});
"use strict";


define([

], function(

) {



    var ThreeFeedbackFunctions = function() {

    };

    var applyToTextures = function(material, x, y) {
        material.map.offset.x = x;
        material.map.offset.y = y;
        material.needsUpdate = true;
        material.special = true;
    };


    ThreeFeedbackFunctions.applyModelTextureTranslation = function(model, x, y) {
        if (!model.children[0].material.special) {
            model.children[0].material = model.children[0].material.clone();
            model.children[0].material.map = model.children[0].material.map.clone();
        }
        applyToTextures(model.children[0].material, x, y);
    };

    return ThreeFeedbackFunctions;

});
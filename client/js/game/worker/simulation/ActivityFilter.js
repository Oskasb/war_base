"use strict";


define([

], function()
 {



    var ActivityFilter = function() {
        this.entries = {};
    };


    ActivityFilter.prototype.notifyActorActiveFrame = function(actor) {
        if (!this.entries[actor.id]) {
            this.entries[actor.id] = {};
        }

        this.entries[actor.id].framesInactive = 0;

    };


    ActivityFilter.prototype.notifyActorActiveState = function(actor, state) {

        if (!this.entries[actor.id]) {
            this.entries[actor.id] = {};
            this.entries[actor.id].framesInactive = 0;
            return;
        }

        if (state) {
            this.entries[actor.id].framesInactive = 0;
        }

    };

     ActivityFilter.prototype.getActorExpectActive = function(actor) {

         if (!this.entries[actor.id]) {
             this.entries[actor.id] = {};
             this.entries[actor.id].framesInactive = 0;
             return true;
         }

         if (this.entries[actor.id].framesInactive > 550 + (Math.random() * 1000000)) {
             this.entries[actor.id].framesInactive = 0;
         }


         if (this.entries[actor.id].framesInactive > 0) {
             return false;
         }

         return true;

     };


     ActivityFilter.prototype.countActiveActors = function() {

        var count = 0;

        for (var key in this.entries) {
            if (this.entries[key].framesInactive) {
                count++;
            }

            this.entries[key].framesInactive++

        }

        return count;
     };

     return ActivityFilter;

});
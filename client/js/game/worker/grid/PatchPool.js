"use strict";

define([],
    function() {
        
        var PatchPool = function(gridSys) {
            var gridSys = gridSys;
            var pool = [];

            this.pool = pool;

            var addPatch = function() {
                return gridSys.createPatch()
            };

            this.generatePatch = function() {
                pool.push(addPatch());
            };
        };

        PatchPool.prototype.push = function(patch) {
            return this.pool.push(patch);
        };

        PatchPool.prototype.pop = function() {
            if (!this.pool.length) {
                this.generatePatch();
            }
            return this.pool.pop()
        };


        PatchPool.prototype.shift = function() {
            if (!this.pool.length) {
                this.generatePatch();
            }
            return this.pool.shift()
        };


        return PatchPool;

    });
/*global define*/
/*jslint vars:true,plusplus:true*/
define([], function () {
    'use strict';

    var Cache = function (maxItems, resolve, dispose) {
        var cache = {};
        var items = 0;

        maxItems = maxItems || 20;

        var findLRU = function () {
            var lru = {
                date: new Date()
            };

            var key;
            for (key in cache) {
                if (cache.hasOwnProperty(key)) {
                    if (cache[key].date < lru.date) {
                        lru = cache[key];
                    }
                }
            }
            return lru.key;
        };

        return {
            'get': function (itemname, callback) {
                if (cache[itemname]) {
                    // update item with new date
                    cache[itemname].date = new Date();
                    return callback(cache[itemname].item);
                }

                // resolve the item with the specific name
                resolve(itemname, function (item) {
                    // create new cache item
                    var cacheitem = {
                        key: itemname,
                        item: item,
                        date: new Date()
                    };

                    if (items >= maxItems) {
                        //find least recently used item
                        var lru_item = findLRU();
                        if (!lru_item) {
                            throw new Error('This should never happen. LRU has nothing to dispose');
                        }
                        // dispose lru item and delete it from the cache
                        dispose(cache[lru_item].item);
                        delete cache[lru_item];
                        items--;
                    }

                    cache[itemname] = cacheitem;
                    items++;
                    callback(item);
                });

            }
        };
    };

    return Cache;
});
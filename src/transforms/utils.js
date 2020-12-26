"use strict";
exports.__esModule = true;
function objectValues(obj) {
    return Object.keys(obj).map(function (i) { return obj[i]; });
}
exports.objectValues = objectValues;
function mapValues(obj, fn) {
    var result = {};
    for (var key in obj) {
        result[key] = fn(obj[key], key);
    }
    return result;
}
exports.mapValues = mapValues;
function filterValues(obj, predicate) {
    var result = {};
    for (var key in obj) {
        var value = obj[key];
        if (predicate(value, key)) {
            result[key] = value;
        }
    }
    return result;
}
exports.filterValues = filterValues;
/**
 * Removes object properties and array values that do not match a predicate
 */
function filterValuesDeep(obj, predicate) {
    if (obj instanceof Array) {
        return obj
            .filter(predicate)
            .map(function (val) { return filterValuesDeep(val, predicate); });
    }
    if (typeof obj === 'object' && obj !== null) {
        var filtered = filterValues(obj, predicate);
        return mapValues(filtered, function (val) { return filterValuesDeep(val, predicate); });
    }
    return obj;
}
exports.filterValuesDeep = filterValuesDeep;
function flatten(input) {
    var arr = [];
    return arr.concat.apply(arr, input);
}
exports.flatten = flatten;
function flatMap(input, fn) {
    return flatten(input.map(fn));
}
exports.flatMap = flatMap;
function compact(arr) {
    return arr.filter(function (a) { return a != undefined; });
}
exports.compact = compact;
/**
 * Binds a function, to an object, or returns undefined if the function is undefined
 * @param fn the function to bind
 * @param obj the object to bind the function to
 * @returns the bound function, or undefined
 */
function bindNullable(fn, obj) {
    return fn ? fn.bind(obj) : fn;
}
exports.bindNullable = bindNullable;

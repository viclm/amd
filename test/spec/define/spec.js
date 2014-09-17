describe('define', function () {

    it('define is global function', function () {
        expect(typeof window.define).toBe('function');
    });

    it('define.amd is not undefined', function () {
        expect(typeof define.amd).toBe('object');
    });

    it('define should not have extra additional methods or properties', function () {
        expect(Object.keys(define)).toEqual(['amd']);
    });

});

describe('id', function () {

    beforeEach(function () {
        require.config({
            baseUrl: ''
        });
    });

    it('relative identifiers are resolved relative to the identifier of the module in which "require" is written and called', function () {
        define('a/b/c', function (require) {
            expect(require.toUrl('./h')).toBe('a/b/h.js');
            expect(require.toUrl('../h/i/j')).toBe('a/h/i/j.js');
        });
        require('a/b/c');
    });

    afterEach(function () {
        require.config({
            baseUrl: 'base/test/spec'
        });
    });
});

describe('dependencies', function () {

    it('default dependencies', function () {
        define('module_id', function (require, exports, module) {
            expect(arguments.length).toBe(3);
        });
        require('module_id');
    });

    xit('default dependencies with less formal arguments', function () {
        define('module_id', function (require) {
            expect(arguments.length).toBe(1);
        });
        require('module_id');
    });


    it('empty dependencies do not have default dependencies', function () {
        define('module_id', [], function () {
            expect(arguments.length).toBe(0);
        });
        require('module_id');
    });

    xit('jquery dependency should expose jquery object', function () {
        define('module_id', ['jquery'], function ($) {
            expect($().jquery).toBeDefined();
        });
        require('module_id');
    });

    it('special dependencies to CommonJS', function () {
        define('module_id', ['require', 'module', 'exports'], function (require, module, exports) {
            expect(typeof require).toBe('function');
            expect(typeof require.toUrl).toBe('function');
            expect(typeof module).toBe('object');
            expect(module.exports).toBeDefined();
            expect(typeof exports).toBe('object');
            expect(Object.keys(exports).length).toBe(0);
        });
        require('module_id');
    });

    it('make sure the order is same between dependencies and formal arguments of factory', function () {
        define('module_id', ['require', 'module', 'exports'], function (require, module, exports) {
            expect(typeof require.toUrl).toBe('function');
            expect(module.exports).toBeDefined();
            expect(Object.keys(exports).length).toBe(0);
        });
        require('module_id');
    });

});

describe('factory', function () {

    it('factorty is required', function () {
        var fn = function () {
            define();
        };
        expect(fn).toThrow();
    });

    it('factory is a object, it will be assigned as exported value of the module', function () {
        var obj = {};
        define('module_id', obj);
        var exported = require('module_id');
        expect(exported).toBe(obj);
    });

    it('factory is a function, it can be called only once', function () {
        var obj = {
            factory: function () {}
        }
        var spy = spyOn(obj, 'factory');
        define('module_id', obj.factory);
        require('module_id');
        expect(obj.factory).toHaveBeenCalled();
        require('module_id');
        expect(obj.factory.calls.count()).toBe(1);
    });

    it('factory function has any return value that coerces to true, the value should be assigned as exported value of module', function () {
        var obj = {};
        define('module_id_1', function () {
            return obj;
        });
        var exported = require('module_id_1');
        expect(exported).toBe(obj);

        define('module_id_2', function () {
        });
        var exported = require('module_id_2');
        expect(exported).toEqual({});

        define('module_id_3', ['exports'], function (exports) {
            exports.a = 1;
            return obj;
        });
        var exported = require('module_id_3');
        expect(exported.a).toBeUndefined();
    });
});
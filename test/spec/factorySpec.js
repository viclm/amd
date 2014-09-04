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


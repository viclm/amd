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

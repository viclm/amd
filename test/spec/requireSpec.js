describe('require', function () {

    describe('global', function () {

        it('is global function', function () {
            expect(typeof window.require).toBe('function');
        });

        it('require.config is a function', function () {
            expect(typeof require.config).toBe('function');
        });

        xit('whose first argument is string should only works with module which already loaded', function () {
            define('module_id', {});
            var fn1 = function () {
                require('module_id');
            };
            var fn2 = function () {
                require('module_id_unloaded');
            };
            expect(fn1).not.toThrow();
            expect(fn2).toThrow();
        });

        it('relative id will be treated as absolute', function () {
            expect(require.toUrl('./a')).toBe('./a.js');
            expect(require.toUrl('a')).toBe('a.js');
        });

        xit('whose first argument is array will load modules asynchronously', function () {
            var obj = {factory: function () {}};
            spyOn(obj, 'factory');
            require(['module_id'], obj.factory);
            expect(obj.factory).toHaveBeenCalled();
        });

        it('require.toUrl resolves module id to path with extension', function () {
            expect(require.toUrl('a')).toBe('a.js');
            expect(require.toUrl('./a')).toBe('./a.js');
        });

        it('require.toUrl does not resolve module id with extension', function () {
            expect(require.toUrl('a.js')).toBe('a.js');
            expect(require.toUrl('./a.js')).toBe('./a.js');
        });

    });

});


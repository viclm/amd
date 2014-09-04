describe('shim', function () {

    require.config({
        baseUrl: 'base/test/spec/shim',
        shim: {
            a: {
                exports: 'A.name'
            },
            b: {
                init: function () {
                    return new B().name;
                }
            },
            c: {
                exports: 'C',
                init: function () {
                    return {
                        construct: C
                    }
                }
            },
            d: {
                deps: ['a', 'b'],
                exports: 'D',
                init: function () { 
                    window.globalD = D.name;
                }
            },
            e: ['c', 'd']
        }
    });

    require(['a', 'b', 'c', 'd', 'e'], function(a, b, c, d) {

        it('exports represents the global property to use for the exports value for the shimmed script', function () {
            expect(a).toBe('a');
        });

        it('any return value of init function is used as the export if it is not undefined', function () {
            expect(b).toBe('b');
            expect(d).toBe(D);
            expect(window.globalD).toBe('d');
        });

        it('valid return value takes precedence over any specified "exports" value', function () {
            expect(c.construct.name).toBe('c');
        });

        it('make sure the deps are executed before the module script itself is executed', function () {
            expect(d.aValue).toBe('a');
            expect(d.bValue).toBe('b');
        });

        it('the shim config can just be the array that corresponds to the "deps" setting', function () {
            expect(e.name).toBe('e');
            expect(e.C.name).toBe('c');
            expect(e.D.name).toBe('d');
        });

    });

    require.config({
        baseUrl: ''
    });

});
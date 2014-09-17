//define(function () {

describe('map', function () {

    require.config({
        baseUrl: 'base/test/spec',
        map: {
            '*': {
                'map/a': 'map/a'
            },
            'map/c': {
                'map/a': 'map/a2'
            },
            'map/c/e': {
                'map/a': 'map/a'
            } 
        }
    });

    it('different versions of dependency work', function (done) {
        require(['map/a', 'map/b', 'map/c', 'map/d', 'map/c/e'], function (a, b, c, d, e) {
            expect(a.version).toBe(1);
            expect(b.a.version).toBe(1);
            expect(c.a.version).toBe(2);
            expect(d.a.version).toBe(1);
            expect(d.c.a.version).toBe(2);
            expect(e.a.version).toBe(1);
            expect(e.c.a.version).toBe(2);
            done();
        });
    });

});

//});
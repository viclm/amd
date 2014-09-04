describe('map', function () {

    beforeEach(function () {
        require.config({
            baseUrl: 'base/test/spec/map',
            map: {
                '*': {
                    a: 'a'
                },
                c: {
                    a: 'a2'
                },
                'c/e': {
                    a: 'a'
                } 
            }
        });
    });

    it('different versions of dependency work', function () {
        require(['a', 'b', 'c', 'd', 'e'], function (a, b, c, d, e) {
            expect(a.version).toBe(1);
            expect(b.a.version).toBe(1);
            expect(c.a.version).toBe(2);
            expect(d.a.version).toBe(1);
            expect(d.c.a.version).toBe(2);
            expect(e.a.version).toBe(1);
            expect(e.c.a.version).toBe(2);
        });
    });

    afterEach(function () {
        require.config({
            baseUrl: ''
        });
    });
});
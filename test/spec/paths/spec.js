describe('paths', function () {

    require.config({
        paths: {
            'paths': 'map',
            'paths/a': 'paths/a'
        }
    });

    it('value for paths object is string', function (done) {
        
        require(['paths/a', 'paths/b'], function (a, b) {

            expect(a.fromPaths).toBe(true);
            expect(b.a.name).toBe('a');

            done();
        
        });
    });

});
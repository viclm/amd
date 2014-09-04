describe('config', function () {

    describe('baseUrl', function () {

        it('indicates the root used for ID-to-path resolutions', function () {
            require.config({baseUrl: 'root'});
            expect(require.toUrl('a')).toBe('root/a.js');
        });

        it('relative paths are relative to the current working directory', function () {
            require.config({baseUrl: './root'});
            expect(require.toUrl('a')).toBe('./root/a.js');
        });

        it('default is blank', function () {
            expect(require.toUrl('a')).toBe('a.js');
        });
    });

    describe('paths', function () {

        it('value for paths object is string', function () {
            require.config({
                paths: {
                    'a': 'h',
                    'b/c': '/i/j.js'
                }
            });
            expect(require.toUrl('a')).toBe('h.js');
            expect(require.toUrl('a/b')).toBe('h/b.js');
            expect(require.toUrl('b/c/d')).toBe('/i/j.js');
        });
    });

    afterEach(function () {
        require.config({
            baseUrl: '',
            paths: {
                'a': 'a',
                'b/c': 'b/c'
            }
        });
    });

});

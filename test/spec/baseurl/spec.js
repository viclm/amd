describe('baseUrl', function () {

    it('indicates the root used for ID-to-path resolutions', function () {
        require.config({baseUrl: 'root'});
        expect(require.toUrl('a')).toBe('root/a.js');
    });

    it('relative paths are relative to the current working directory', function () {
        require.config({baseUrl: './root'});
        expect(require.toUrl('a')).toBe('http://localhost:9876/root/a.js');
    });

    afterEach(function () {
        require.config({
            baseUrl: 'base/test/spec'
        });
    });

});
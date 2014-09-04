describe('id', function () {

    it('relative identifiers are resolved relative to the identifier of the module in which "require" is written and called', function () {
        define('a/b/c', function (require) {
            expect(require.toUrl('./h')).toBe('a/b/h.js');
            expect(require.toUrl('../h/i/j')).toBe('a/h/i/j.js');
        });
        require('a/b/c');
    });

    it('top-level identifiers are resolved off the conceptual module name space root', function () {
        define('a/b/c', function (require) {
            expect(require.toUrl('h')).toBe('h.js');
        });
        require('a/b/c');
    });
});

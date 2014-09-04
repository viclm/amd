describe('define', function () {

    it('define is global function', function () {
        expect(typeof window.define).toBe('function');
    });

    it('define.amd is not undefined', function () {
        expect(typeof define.amd).toBe('object');
    });

    it('define should not have extra additional methods or properties', function () {
        expect(Object.keys(define)).toEqual(['amd']);
    });

});

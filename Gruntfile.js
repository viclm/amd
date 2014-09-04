module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-coffee');

  grunt.initConfig({
    coffee: {
      options: {
      },
      compile: {
        src: 'src/**.coffee',
        dest: 'dist/amd.js'
      }
    }
  });

  grunt.registerTask('default', ['coffee']);

};

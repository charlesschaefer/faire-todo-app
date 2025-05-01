const argv = require('minimist')(process.argv.slice(2)),
services = (argv.services !== true) && argv.services;
const testFile = argv.testFile || null;

// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  const karmaConfig = {
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
        seed: 4321
      },
      services: services,
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/faire-todo-app'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    restartOnFileChange: true,
    files: [
      { pattern: './src/test.ts', watched: false }
    ]
  };

  // If testFile is specified, only run the specified test file
  if (testFile) {
    karmaConfig.files = [
      { pattern: testFile, watched: false }
    ];
  }

  config.set(karmaConfig);
};

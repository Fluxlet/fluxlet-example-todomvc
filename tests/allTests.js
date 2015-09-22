'use strict';

var testSuite = require('./test.js');
var fs = require('fs');
var argv = require('optimist').default('laxMode', false).default('browser', 'chrome').argv;
var rootUrl = 'http://localhost:3000';
var frameworkNamePattern = /^[a-z-_\d]+$/;

var list = [ { name: 'fluxlet', path: ''}];

// if a specific framework has been named, just run this one
if (argv.framework) {
	list = list.filter(function (framework) {
		return [].concat(argv.framework).some(function (f) {
			return f === framework.name;
		});
	});

	if (list.length === 0) {
		console.log('You have either requested an unknown or an un-supported framework');
	}
}

// run the tests for each framework
list.forEach(function (framework) {
	testSuite.todoMVCTest(
		framework.name,
		rootUrl + framework.path + '/index.html', argv.speedMode,
		argv.laxMode, argv.browser);
});

#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const Plugin = require('../src/plugin.js');

const test = new Plugin({dynamic: false});

function sayHello(params) {
  if (!params || params.length === 0) {
    return 'Hello world';
  } else {
    return 'Hello ' + params[0];
  }
}

async function sayBye(params) {
  return Promise.resolve('Bye bye ' + test.options['byename'].value);
}

test.testRpc = async function (params) {
  const method = params[0] || 'getinfo';
  const response = await test.rpc.call(method);
  return response;
}

function useLessBackup(params) {
  fs.writeFile('logDb', params.writes, () => {});
  return true;
}

function log(params) {
  test.log('Testing logs', params[0]);
  return '';
}

test.onInit = function (params) {
  test.log('Test plugin initialized !');
  /* Test you cannot send empty logs */
  let error = '';
  try {
    test.log(null);
  } catch (e) {
    error = e.message;
  }
  assert(error != '');
  test.log(error);
}

test.subscribe('warning');
test.notifications.warning.on('warning', (params) => {
  fs.writeFile('log', params.warning.log, () => {});
});

test.addHook('db_write', useLessBackup);

test.addOption('byename', 'continuum', 'The name of whow I should say bye to', 'string');
test.addMethod('hello', sayHello, 'name', 'If you launch me, I\'ll great you !');
test.addMethod('bye', sayBye, '', 'If you launch me, I\'ll say good bye');
test.addMethod('testrpc', test.testRpc, 'method', '', 'Test the RPC interface');
test.addMethod('testlog', log, 'level', '');
test.start();

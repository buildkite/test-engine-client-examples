// Jest 30.5 on Node 24.9+ loads this ES module through synchronous require(esm).
const { work } = require('./work.mjs');

test('records a child from a synchronously required ES module', () => {
  work('required esm child');
});

test('records a child after resetModules', () => {
  jest.resetModules();
  require('./work.mjs').work('reset esm child');
});

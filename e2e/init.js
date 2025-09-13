const detox = require('detox');
const config = require('../.detoxrc.js');
const adapter = require('detox/runners/jest/adapter');

jest.setTimeout(300000);
jasmine.getEnv().addReporter(adapter);

beforeAll(async () => {
  await detox.init(config, { initGlobals: false });
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
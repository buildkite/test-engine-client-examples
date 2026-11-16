// Load before Express, http and pg, just as in an already-instrumented app.
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg');

const sdk = new NodeSDK({
  serviceName: 'project-board',
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    // Synthetic example data only: parameter capture can expose sensitive data.
    new PgInstrumentation({ enhancedDatabaseReporting: true }),
  ],
});
sdk.start();
module.exports = sdk;

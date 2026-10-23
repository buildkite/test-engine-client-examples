# Jest OTel child-span verification

Draft companion to [bktest#83](https://github.com/buildkite/bktest/pull/83).
The pipeline packs that PR's exact collector commit as `1.13.0-beta.2`, without
publishing anything. Do not merge this verification pin as a released example.

Two deterministic passing tests perform real loopback network I/O:

- HTTP GET inside a manual active span, answered by an in-process HTTP server
  that continues the test's trace.
- GraphQL query and resolver instrumentation, with native fetch/undici I/O.

There is no setup file. `jest.config.js` names the instrumentation packages in
the reporter's `otelInstrumentations` option and sets the collector's Jest
`runtime`, which patches the modules Jest loads (here `graphql`) as the tests
require them; Node's `http` and `fetch` are instrumented in the worker.

With the Node version in `mise.toml` active, from this directory:

```sh
bash run <bktest commit>
```

Without a token, this runs the tests but does not export to Test Engine. The
Buildkite step mints a short-lived suite-scoped OIDC credential and uses a
unique run key ending in `-jest-otel-children`. There is no Tests plugin or
bktec upload: both `test.execution` roots and their children must arrive through
the collector's direct OTLP path. The expected result is two passing executions
tagged `collector.mode:otel-children`, with the manual span, the HTTP client
span and the server span under the first test, and GraphQL and fetch spans
under the second. `OTEL_PROOF` log lines contain the root span and trace IDs
for correlating the stored traces, not credentials.

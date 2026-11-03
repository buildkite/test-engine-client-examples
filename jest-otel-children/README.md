# Jest OTel child-span verification

Draft companion to [bktest#87](https://github.com/buildkite/bktest/pull/87),
following [examples#86](https://github.com/buildkite/test-engine-client-examples/pull/86).
The pipeline packs the exact collector commit `0363ec624f8c51d64e6864f7f8da5dd8ae2daf7e` as `1.13.0-beta.2`, without
publishing anything. Do not merge this verification pin as a released example.

Six deterministic passing tests exercise child instrumentation:

- HTTP GET inside a manual active span.
- Native `fetch` (undici).
- Express routes registered at file load.
- An async GraphQL resolver.
- A real node-redis client performing connect/SET/GET against an in-process
  deterministic RESP peer (not a real Redis server).
- Express loaded through a Jest `moduleNameMapper` alias, an adversarial
  resolver case. A passing test alone does not prove instrumentation worked.

There is no setup file and no instrumentation option. `jest.config.js` sets
the collector's Jest `runtime`. This prototype adds package instrumentation to
beta.2's manual/http/fetch support, selected by installed instrumentation and
the standard `OTEL_NODE_*_INSTRUMENTATIONS` switches. No package is published.

With the Node version in `mise.toml` active, from this directory:

```sh
bash run <bktest commit>
```

Without `BUILDKITE_TESTS_OTLP_TOKEN`, OTel mode is off, so no test span is
current and the `OTEL_PROOF` hook fails the tests. The Buildkite step mints a
short-lived suite-scoped OIDC credential and uses a unique run key ending in
`-jest-otel-children`. There is no Tests plugin or bktec upload: both
`test.execution` roots and their children must arrive through the collector's
direct OTLP path. Expected parentage is test → HTTP client → server → Express
middleware/handler, test → GraphQL execution → resolver, and three Redis spans
directly under the Redis test. The alias should have the same Express spans
as the direct import. `OTEL_PROOF` log lines contain the root span and trace
IDs for correlating stored traces, not credentials. Local OTLP decoding found
correct ordinary package parents, but the alias test had HTTP children only;
the production run will determine whether Test Engine stores the same gap.

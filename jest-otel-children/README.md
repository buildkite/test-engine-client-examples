# Jest OTel child-span verification

Draft companion to [bktest#83](https://github.com/buildkite/bktest/pull/83).
The pipeline packs that PR's exact collector commit as `1.13.0-beta.2`, without
publishing anything. Do not merge this verification pin as a released example.

Two deterministic passing tests perform real loopback network I/O:

- HTTP GET inside a manual active span.
- GraphQL query and resolver instrumentation, with native fetch/undici I/O.

`otel.setup.js` connects the Jest sandbox's OTel API to the collector's test
context and patches the actual GraphQL exports Jest loaded. Simply enabling
require hooks does not instrument Jest's userland module registry. The HTTP
instrumentation disables incoming server spans so the proof isolates client I/O.

With the Node version in `mise.toml` active, from this directory:

```sh
bash run 497cba717c2a53d87c3bde7011d3493cfeb5a25d
```

Without a token, this runs the tests but does not export to Test Engine. The
Buildkite step mints a short-lived suite-scoped OIDC credential and uses a
unique run key ending in `-jest-otel-children`. There is no Tests plugin or
bktec upload: both `test.execution` roots and their children must arrive through
the collector's direct OTLP path. The expected result is two passing executions
tagged `collector.mode:otel-children`, with HTTP/manual children under the first
test and GraphQL/fetch children under the second. `OTEL_PROOF` log lines contain
the root span and trace IDs for correlating the stored traces, not credentials.

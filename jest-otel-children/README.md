# Jest OTel child-span verification

Draft companion to [bktest#87](https://github.com/buildkite/bktest/pull/87),
following [examples#86](https://github.com/buildkite/test-engine-client-examples/pull/86).
The pipeline packs the exact collector commit `c5021ef6f5778b0a85a183100cbf978fe59c9eba` as `1.13.0-beta.3`, without
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

There is no Jest setup file and no instrumentation option. `jest.config.js` sets
the collector's Jest `runtime`. Beta.3 adds package instrumentation to
beta.2's manual/http/fetch support. Discovery selects 2.x SDK-line instrumentations
declared in project/workspace manifests, plus auto-instrumentations-node's bundle,
not incidental hoisted dependencies. The default exclusions cover fs/host-metrics,
net/dns, aws-sdk/kafkajs/amqplib, pino/winston/bunyan, metrics-only and browser
instrumentations. Selection is narrowed by the standard
`OTEL_NODE_ENABLED_INSTRUMENTATIONS` and `OTEL_NODE_DISABLED_INSTRUMENTATIONS`
switches. This harness declares all five of its instrumentations directly;
none are default-off, so it needs no selection overrides.
No package is published.

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
IDs for correlating stored traces, not credentials. Build 1048 confirmed the
old alias gap in production; build 1049 verified the resolver fix, with five
children for both Express imports (two HTTP and three Express). This beta.3
pin retains that fix. Local OTLP regressions also verify that mapping Express
to a local mock does not instrument the mock, pg selection and late children
under their original tests. The production rerun must verify stored children
against these proof roots, not just a green build.

`npm test` now also fails if successful OTLP exports do not contain exactly
these children under the logged roots: direct Express 5, mapped Express 5,
GraphQL 4, Redis 3, HTTP/manual 3 and fetch 2. The check validates operation
names/scopes and the entire parent chain, not only counts. A preload observes
the real exporter's successful callbacks without changing its destination;
no relay, extra dependency or new credential is needed. `OTEL_EXPORT_VERIFIED`
lines report each checked root and count. This detects instrumentation/export
regressions automatically, but does not prove backend storage: production
stored traces still need separate verification against `OTEL_PROOF`.

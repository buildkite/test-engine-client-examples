# Vitest OpenTelemetry package spans (verification)

Verifies [buildkite/bktest#118](https://github.com/buildkite/bktest/pull/118), which
records package spans in Vitest's OpenTelemetry mode. Each test runs the same
app from CommonJS, ES module or TypeScript: an Express route called with fetch,
a GraphQL query, node-redis and ioredis commands, and Postgres queries. Like most
apps, it declares `@opentelemetry/auto-instrumentations-node` rather than
individual instrumentation packages.

CI starts Postgres and Redis with `bin/services` and installs the unreleased
collector at a pinned bktest commit.

| Step | ES module and TypeScript tests |
| --- | --- |
| import-in-the-middle 3.6.0 | pg, node-redis, GraphQL, HTTP and fetch spans. Express and ioredis warn: Vitest imports their entry points by file path. |
| patched import-in-the-middle | Every package, as in the CommonJS test. |

`vitest.config.js` resolves `graphql` and its subpaths to GraphQL's CommonJS
build, which its instrumentation patches. The patch in `patches/` is the proposed
upstream import-in-the-middle fix.

Locally, with Postgres and Redis running:

```sh
npm ci --prefix vitest-otel-packages
cd vitest-otel-packages && ../bin/install-unreleased-js-collector <bktest sha>
PGPORT=5432 REDIS_PORT=6379 BUILDKITE_ANALYTICS_TOKEN=your-suite-token npx vitest run
```

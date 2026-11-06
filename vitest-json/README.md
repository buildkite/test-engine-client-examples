# Vitest JSON production comparison

Small JSON-mode fixture for verifying the candidate collector against released
1.13.0. No `otelEnabled` option or native OpenTelemetry SDK is configured.
Both CI jobs use the same Vitest 5.1.0 tests and reporter configuration.

```sh
cd vitest-json
npm ci
npm run verify
```

For the unreleased candidate, replace the npm collector with the packed commit
in `collector.sha`, using the same installer as the OTel example:

```sh
bash ../vitest-otel/install-collector
JSON_PROOF_MODE=candidate npm run verify
```

`npm test` intentionally fails one test with `widget lookup failed` to exercise
stored failure reasons. `npm run verify` checks every expected result and exits
successfully only for the expected fixture outcomes. The two Test Engine runs
are deliberately failed even when the CI comparison jobs are green. The JSON
reporter writes a local proof file; only the collector uploads results.

CI gives each mode a separate run key and `json.proof.mode` tag. Independently
compare stored names, scopes, source locations, results and failure reasons
between the candidate and control, rather than treating a successful upload as
proof of ingestion. Both jobs set the same `vitest-json` location prefix.

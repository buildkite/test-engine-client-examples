# AGENTS.md

Customers copy these examples, and the Buildkite docs link to them. The team also uses this pipeline to test bktest and test collector releases.

- Keep `.buildkite/pipeline.yml` green. Never add `soft_fail` or failing or random tests to it; intended failures belong only in `.buildkite/failures.yml`.
- Run test steps through the pinned Tests plugin. Steps that install bktest use `client-version: *bktest_version`, so `BKTEST_VERSION` tests a bktest release across every example.
- Start a new example from the closest existing one, and keep its README in the same shape. When a step changes, update the copyable step in that example's README to match.
- After changing an example or bumping bktest or a collector, create a Buildkite API or UI build with `VERIFY_RESULTS=true` and read its verification step. Update `.buildkite/expected-results.json` only for intended changes. See `.buildkite/README.md`.

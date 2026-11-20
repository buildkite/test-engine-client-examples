# AGENTS.md

Customers copy these examples, and the Buildkite docs link to them. The team also uses this pipeline to test bktec and test collector releases.

- Keep `.buildkite/pipeline.yml` green. Never add `soft_fail` or failing or random tests to it; intended failures belong only in `.buildkite/failures.yml`.
- Run test steps through the pinned Tests plugin. Steps that install bktec use `client-version: *bktec_version`, so `BKTEC_VERSION` tests a bktec release across every example.
- Start a new example from the closest existing one, and keep its README in the same shape. When a step changes, update the copyable step in that example's README to match.
- After changing an example or bumping bktec or a collector, run `.buildkite/verify-results.py` on the build. Update `.buildkite/expected-results.json` only for intended changes. See `.buildkite/README.md`.

# Test Engine examples

- This public repository is both copyable customer configuration and a release-check harness. Keep harness behaviour under `.buildkite/`, outside example directories.
- RSpec is the reference layout. Other runners still use the legacy root pipeline; migrate only the requested runner. Do not remove their shared suite, environment variables or `soft_fail` as incidental cleanup.
- A plain runner directory is the Tests-plugin quick start with built-in upload. `-collector` and `-otel` run bktec directly, pinned in mise, with exactly one collector upload path. Each step has its own `examples-<directory>` suite; feature steps add a suffix.
- To add a runner, follow the three RSpec directories and [README template](.buildkite/README.example.md). Port the kite workshop, use idiomatic test names, and add the example to the root README. Shared specs and domain code must be identical within a runner; helpers differ. OTel adds the local HTTP/SQLite Orders test.
- New suites and their OIDC policies must exist before public pipeline jobs run. The plugin cannot bootstrap suites from a public pipeline. Do not store tokens in this repository.
- Run `.buildkite/harness/upload check` with the Buildkite agent and jq installed. It checks migrated examples only. Keep tests reliable; intentional failures belong in `.buildkite/fixtures/` and `.buildkite/failures.yml`.
- Run tests in each affected directory with `mise install`, `mise exec -- bundle install` and `mise exec -- bundle exec rspec`. RSpec and collector expect 8 passed / 1 skipped; OTel expects 9 passed / 1 skipped.
- `BKTEC_VERSION` overrides RSpec's pin on a Buildkite build. `EXAMPLES=rspec,rspec-collector` limits the dynamically uploaded examples, not unmigrated runners. Collector version overrides and `harness/use` are not implemented yet.
- Verify a build with `BUILDKITE_ORGANIZATION_SLUG=buildkite .buildkite/harness/verify <build-uuid> <suite-slug>...`. Local use needs `BUILDKITE_API_TOKEN` with `read_suites`; CI uses suite-audience OIDC. Exit 1 means a regression or missing results; exit 2 means API/authentication unavailable.
- `expected.yml` is JSON-compatible YAML so jq can read it without another dependency. List only exceptions to 8 passed / 1 skipped. Verify identities against an earlier main run and between the quick start and collector; report first-run baseline bootstrapping explicitly.
- Keep one pin per tool, exact collector pins, and no build cache. Do not add git-ref installers, additional harness commands or new dependencies without a demonstrated need.

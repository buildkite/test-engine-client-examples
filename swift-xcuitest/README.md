# Swift XCUITest PR-head restart harness

This experimental branch runs the restart fixture twice directly against Test
Engine and twice through the bktec OTLP relay. It leaves the original harness
branches unchanged. Each job uses a fresh `BUILDKITE_ANALYTICS_KEY`.

The pipeline pins `SWIFT_COLLECTOR_SHA` in buildkite/bktest and `BKTEC_SHA` in
buildkite/test-engine-client. `bin/install-pr-collector` extracts the collector's
monorepo subdirectory into the Xcode project's local package reference. The
Linux build step cross-compiles the relay for Darwin arm64; the Tests plugin
does not install a released client.

Two tests finish before test03 kills the runner. Xcode starts a replacement
runner and completes two more. `bin/verify-results` checks five `.xcresult`
records (four passes and the deliberate crash) and runner replacement. It does
not infer export success from collector debug output: final acceptance requires
four backend executions per run in Test Engine, with test03 absent.

Build artifacts retain the collector source archive and SHA, package resolution
log and lockfile, xcodebuild log, and `.xcresult`. The relay build retains its
binary and source SHA. Buildkite retains the job logs including relay counters.

To repeat at new heads, update the two pinned SHAs and push this branch. The
script selects the first available iPhone Simulator; `XCUITEST_DESTINATION` can
override it.

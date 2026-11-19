# <Runner and setup>

Describe who should copy this setup, how bktec runs tests and which single upload method it uses. Link to [pipeline.yml](./pipeline.yml) and the collector helper, if any.

## Adopt it

List the files to copy. Explain which suite slug and test/result paths to change, link to the OIDC policy documentation, and explain removing the example's `cd` and mise `dir` at the customer's repository root. Public pipelines must create their suite and policy before the first run. Include any version-specific limitation that affects a copied setup.

## Run locally

Give the actual install and test commands, say whether they upload, and name credentials needed to exercise bktec outside Buildkite. Do not put repository harness commands in customer setup instructions.

## What the fixtures cover

State the expected passed and skipped counts.

| Specs | Test Engine behaviour |
| --- | --- |
| Frames, Sails, Bridles, Flight log | Four files taking 0.2, 0.4, 0.8 and 1.6 seconds, for timing-based splitting |
| Flight checks › Wind | Nested scope and parameterized names at 25, 5 and 60 km/h |
| Repairs archive | A deep file path for test selectors |
| Night flying | One skipped test, waiting for lights |

For an OpenTelemetry setup, add the Orders row and explain its local HTTP and SQLite child spans. Link to sibling setups.

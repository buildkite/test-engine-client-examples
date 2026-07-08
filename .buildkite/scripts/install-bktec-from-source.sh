#!/usr/bin/env bash
set -euo pipefail

# Sourced by each example's bin/test when BKTEC_REF is set, immediately before
# `bktec run`. Builds bktec from that git ref and prepends it to PATH,
# overriding whatever the tests#v1.0.0 plugin resolved.

echo "--- :building_construction::golang: Building bktec from source (ref: ${BKTEC_REF})" >&2

BKTEC_SRC_DIR="${TMPDIR:-/tmp}/bktec-from-source/${BKTEC_REF}"
mkdir -p "$BKTEC_SRC_DIR"

GOBIN="$BKTEC_SRC_DIR" go install \
  -ldflags "-X 'github.com/buildkite/test-engine-client/v2/internal/version.Version=dev-${BKTEC_REF}'" \
  "github.com/buildkite/test-engine-client/v2@${BKTEC_REF}"

# The module path's /v2 suffix makes `go install` name the binary
# "test-engine-client" rather than "bktec" — rename it to match.
if [[ -f "${BKTEC_SRC_DIR}/test-engine-client" ]]; then
  mv "${BKTEC_SRC_DIR}/test-engine-client" "${BKTEC_SRC_DIR}/bktec"
fi

export PATH="${BKTEC_SRC_DIR}:${PATH}"
export BUILDKITE_TEST_ENGINE_CLIENT_PATH="${BKTEC_SRC_DIR}/bktec"

echo "bktec built from ${BKTEC_REF}: $(bktec --version 2>/dev/null || echo unknown)" >&2

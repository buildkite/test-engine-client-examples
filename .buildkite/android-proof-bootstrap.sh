#!/usr/bin/env bash
set -euo pipefail
# Verification branch only. Never resolve or publish an unreleased package.
git clone --depth 1 https://github.com/buildkite/bktest.git .collector-source
git -C .collector-source fetch --depth 1 origin 4cc0984ebc4dec417effa882d5aae566de28783f
git -C .collector-source checkout 4cc0984ebc4dec417effa882d5aae566de28783f
git -C .collector-source fetch --depth 2 origin b5920c0f33ca1d297267ced6fd30748b6b8aaa20
git -C .collector-source cherry-pick --no-commit b5920c0f33ca1d297267ced6fd30748b6b8aaa20
git -C .collector-source rev-parse HEAD
git -C .collector-source diff --cached --stat

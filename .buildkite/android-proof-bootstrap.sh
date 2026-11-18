#!/usr/bin/env bash
set -euo pipefail
# Verification branch only. Never resolve or publish an unreleased package.
git clone --depth 1 https://github.com/buildkite/bktest.git .collector-source
git -C .collector-source fetch --depth 1 origin d73a5cbb5653dbc31541ac5d9a9d6fc9f178f54f
git -C .collector-source checkout d73a5cbb5653dbc31541ac5d9a9d6fc9f178f54f
git -C .collector-source fetch --depth 3 origin 7caf07e200ead50d15bb9256f64d0169dfa4bd2a
git -C .collector-source cherry-pick --no-commit 1e85ca15fababe1a7df89cea69d379435c437a1c..7caf07e200ead50d15bb9256f64d0169dfa4bd2a
git -C .collector-source rev-parse HEAD
git -C .collector-source diff --cached --stat

#!/bin/sh
set -eu
# Verification only: print names, never credential values.
echo 'CONTAINER_ENV_NAMES_BEGIN'
env | cut -d= -f1 | sort
echo 'CONTAINER_ENV_NAMES_END'
for name in BUILDKITE_AGENT_ACCESS_TOKEN BUILDKITE_AGENT_TOKEN BUILDKITE_AGENT_JOB_API_SOCKET BUILDKITE_AGENT_JOB_API_TOKEN; do
    if env | cut -d= -f1 | grep -qx "$name"; then
        echo "FORBIDDEN_CONTAINER_AUTHORITY $name"
        exit 99
    fi
done
echo 'PASS no agent credentials or job-API environment'
exec "$@"

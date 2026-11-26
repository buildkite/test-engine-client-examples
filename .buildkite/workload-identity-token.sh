#!/usr/bin/env bash
set -eu

# Allow time for the verifier's 10-minute poll and final per-job API sweep.
oidc_token=$(buildkite-agent oidc request-token --audience "$BUILDKITE_AUDIENCE" --lifetime 3600)

response=$(curl --silent --show-error --fail-with-body --max-time 30 https://buildkite.com/oauth/token \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode "client_id=$BUILDKITE_CLIENT_ID" \
  --data-urlencode 'client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer' \
  --data-urlencode "client_assertion=$oidc_token") || {
  status=$?
  # Print HTTP errors, not a partial success response on a transport error.
  if [ "$status" -eq 22 ]; then printf '%s\n' "$response" >&2; fi
  exit "$status"
}

printf '%s' "$response" | python3 -c '
import json, sys
token = json.load(sys.stdin).get("access_token")
if not isinstance(token, str) or not token:
    sys.exit("Workload identity exchange returned no access token")
print(token)
'

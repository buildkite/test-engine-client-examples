#!/usr/bin/env python3
"""Check that Test Engine recorded the expected results for an examples build."""

import argparse
from collections import Counter
from email.utils import parsedate_to_datetime
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

API = "https://api.buildkite.com/v2"
PIPELINE = f"{API}/organizations/buildkite/pipelines/test-engine-client-examples"
SUITE = f"{API}/analytics/organizations/buildkite/suites/test-engine-client-examples"
NO_RESULTS = {
    ":pipeline:", ":swift: XCUITest build and discover", ":android: Discover JVM tests",
    ":gradle: Discover Kotlin / Java tests",
}
# Network, HTTP, JSON, and unexpected response shapes.
API_ERRORS = (OSError, ValueError, KeyError, TypeError)
next_request = 0
retry_deadline = float("inf")


def die(message):
    print(message, file=sys.stderr)
    raise SystemExit(2)


def get(url):
    global next_request
    request = Request(url, headers={
        "Authorization": f"Bearer {os.environ['BUILDKITE_API_TOKEN']}",
        "Buildkite-Version": "2026-08-01",
    })
    while True:
        time.sleep(max(0, next_request - time.monotonic()))
        next_request = time.monotonic() + 1.3  # At most 47 requests in any minute.
        try:
            with urlopen(request, timeout=30) as response:
                return json.load(response), response.headers.get("Link", "")
        except HTTPError as error:
            if error.code in (401, 403):
                die(f"AUTH ERROR: HTTP {error.code}; check the token's scopes and access")
            if error.code != 429:
                raise
            delay = error.headers.get("Retry-After")
            if delay is not None:
                try:
                    delay = float(delay)
                except ValueError:
                    delay = parsedate_to_datetime(delay).timestamp() - time.time()
            else:
                # Buildkite's Reset headers are seconds, not Unix timestamps.
                resets = [float(error.headers[f"{prefix}-Reset"])
                          for prefix in ("RateLimit-User", "RateLimit")
                          if error.headers.get(f"{prefix}-Remaining") == "0"
                          and f"{prefix}-Reset" in error.headers]
                delay = max(resets) if resets else max(
                    float(error.headers.get("RateLimit-User-Reset", 0)),
                    float(error.headers.get("RateLimit-Reset", 0))) or 60
            if time.monotonic() + max(1.3, delay) > retry_deadline:
                die("API ERROR: rate-limit retry would exceed --timeout")
            print(f"RATE LIMITED: retrying in {max(1.3, delay):.1f}s", flush=True)
            next_request = time.monotonic() + max(1.3, delay)


def job_ids(build_number):
    """Map each example label to its job IDs. Parallel XCUITest shards share one label."""
    jobs = {}
    url = f"{PIPELINE}/builds/{build_number}/jobs?per_page=100&include_retried_jobs=false"
    while url:
        page, _ = get(url)
        for job in page["items"]:
            if job["type"] == "script" and not job.get("retried"):
                if not job.get("started_at"):
                    die(f"BUILD INCOMPLETE: {job['name']}: {job.get('state', 'not started')}")
                label = re.sub(r"XCUITest shard \d+", "XCUITest shard %n", job["name"])
                jobs.setdefault(label, []).append(job["id"])
        url = page["links"].get("next")
    return {label: ids for label, ids in jobs.items() if label not in NO_RESULTS}


def recorded(build, job_id=None):
    """Sum paginated test metrics (a JSON array, with Link-header pagination)."""
    tags = f"build.id:{build['id']}"
    if job_id is not None:
        tags += f",build.job_id:{job_id}"
    url = f"{SUITE}/tests?" + urlencode({
        "tags": tags, "min_timestamp": build["created_at"], "per_page": 100,
    })
    total = Counter()
    while url:
        tests, link = get(url)
        if not isinstance(tests, list):
            raise TypeError("Tests API returned a page that isn't a list")
        for test in tests:
            results = test["executions_count_by_result"]
            if not isinstance(results, dict):
                raise TypeError("Tests API returned result counts that aren't an object")
            total.update(results)
        next_page = re.search(r'<([^>]+)>; rel="next"', link)
        url = next_page and next_page[1]
    return +total  # Drop zero counts.


def main(argv=None):
    global next_request, retry_deadline
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("build", type=int, help="examples pipeline build number")
    parser.add_argument("--timeout", type=float, default=600,
                        help="seconds after which no new check starts (default: 600)")
    parser.add_argument("--interval", type=float, default=60, help="seconds between checks (default: 60)")
    args = parser.parse_args(argv)
    if args.timeout < 0 or args.interval <= 0:
        parser.error("--timeout must be nonnegative and --interval must be positive")
    next_request = 0
    retry_deadline = time.monotonic() + args.timeout
    if not os.environ.get("BUILDKITE_API_TOKEN"):
        die("AUTH ERROR: set BUILDKITE_API_TOKEN to a token with read_builds and read_suites")
    expected = {label: +Counter(results) for label, results in
                json.loads(Path(__file__).with_name("expected-results.json").read_text()).items()}

    try:
        build, _ = get(f"{PIPELINE}/builds/{args.build}?exclude_jobs=true&exclude_pipeline=true")
        if not build.get("finished_at"):
            die("BUILD NOT FINISHED: run this after every job has finished")
        jobs = job_ids(args.build)
    except API_ERRORS as error:
        die(f"API ERROR: cannot read build {args.build}: {error}")
    unknown = jobs.keys() - expected.keys()
    if unknown:
        die(f"CONFIG ERROR: steps without expectations: {sorted(unknown)}")
    for label in sorted(expected.keys() - jobs.keys()):
        print(f"NOT RUN: {label}")
    if not jobs:
        die("BUILD INCOMPLETE: no examples to check")
    expected = {label: expected[label] for label in jobs}
    wanted_total = sum(expected.values(), Counter())

    started = time.monotonic()
    retry_deadline = started + args.timeout
    while True:
        try:
            total = recorded(build)
            error = None
        except API_ERRORS as err:  # Retry on the next check.
            total, error = Counter(), err
        elapsed = time.monotonic() - started
        if (not error and not (wanted_total - total)) or elapsed + args.interval > args.timeout:
            break
        print(f"WAIT {elapsed:.1f}s: build totals expected {dict(wanted_total)}, recorded {dict(total)}", flush=True)
        time.sleep(args.interval)

    if error:
        die(f"API ERROR: {error}")
    try:
        counts, pending = {}, list(jobs)
        while True:
            for label in pending:
                counts[label] = sum((recorded(build, job_id) for job_id in jobs[label]), Counter())
            pending = [label for label in jobs if expected[label] - counts[label]]
            if not pending or time.monotonic() + args.interval > retry_deadline:
                break
            print(f"WAIT: results still deficient for {pending}", flush=True)
            time.sleep(args.interval)
    except API_ERRORS as error:
        die(f"API ERROR: {error}")
    unverified = {label for label in expected if counts[label] != expected[label]}
    for label, wanted in expected.items():
        if label in unverified:
            got = counts[label]
            verdict = "MISSING" if not got else "DUPLICATE" if not (wanted - got) else "MISMATCH"
            print(f"{verdict}: {label}: expected {dict(wanted)}, recorded {dict(got)}")
        else:
            print(f"OK: {label}")
    elapsed = time.monotonic() - started
    print(f"{'FAIL' if unverified else 'PASS'}: build {args.build}, "
          f"{len(unverified)}/{len(expected)} examples unverified, elapsed {elapsed:.1f}s")
    if unverified:
        print("Recorded counts (review before updating expected-results.json):")
        print(json.dumps({label: dict(got) for label, got in counts.items()}, indent=2))
    return 1 if unverified else 0


if __name__ == "__main__":
    sys.exit(main())

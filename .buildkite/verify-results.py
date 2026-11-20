#!/usr/bin/env python3
"""Check that Test Engine recorded the expected results for an examples build."""

import argparse
from collections import Counter
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


def die(message):
    print(message, file=sys.stderr)
    raise SystemExit(2)


def get(url):
    request = Request(url, headers={
        "Authorization": f"Bearer {os.environ['BUILDKITE_API_TOKEN']}",
        "Buildkite-Version": "2026-08-01",
    })
    try:
        with urlopen(request, timeout=30) as response:
            return json.load(response), response.headers.get("Link", "")
    except HTTPError as error:
        if error.code in (401, 403):
            die(f"AUTH ERROR: HTTP {error.code}; check the token's scopes and access")
        raise


def job_ids(build_number):
    """Map each example label to its job IDs. Parallel XCUITest shards share one label."""
    jobs = {}
    url = f"{PIPELINE}/builds/{build_number}/jobs?per_page=100&include_retried_jobs=false"
    while url:
        page, _ = get(url)
        for job in page["items"]:
            if job["type"] == "script" and not job.get("retried"):
                label = re.sub(r"XCUITest shard \d+", "XCUITest shard %n", job["name"])
                jobs.setdefault(label, []).append(job["id"])
        url = page["links"].get("next")
    return {label: ids for label, ids in jobs.items() if label not in NO_RESULTS}


def recorded(build, ids):
    """Sum the results Test Engine recorded for these jobs of the build."""
    total = Counter()
    for job_id in ids:
        url = f"{SUITE}/tests?" + urlencode({
            "tags": f"build.id:{build['id']},build.job_id:{job_id}",
            "min_timestamp": build["created_at"],
            "per_page": 100,
        })
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
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("build", type=int, help="examples pipeline build number")
    parser.add_argument("--timeout", type=float, default=600,
                        help="seconds after which no new check starts (default: 600)")
    parser.add_argument("--interval", type=float, default=60, help="seconds between checks (default: 60)")
    args = parser.parse_args(argv)
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
    if jobs.keys() != expected.keys():
        differ = sorted(jobs.keys() ^ expected.keys())
        die(f"CONFIG ERROR: build labels and expected-results.json differ: {differ}")

    started, delayed = time.monotonic(), set()
    while True:
        try:
            counts, error = {label: recorded(build, ids) for label, ids in jobs.items()}, None
        except API_ERRORS as err:  # Retry on the next check.
            counts, error = {}, err
        unverified = {label for label, wanted in expected.items() if counts.get(label) != wanted}
        elapsed = time.monotonic() - started
        if not unverified or elapsed + args.interval > args.timeout:
            break
        delayed |= unverified
        print(f"WAIT {elapsed:.1f}s: {len(unverified)} examples not verified yet", flush=True)
        time.sleep(args.interval)

    if error:
        die(f"API ERROR: {error}")
    for label, wanted in expected.items():
        if label in unverified:
            got = counts[label]
            print(f"{'MISMATCH' if got else 'MISSING'}: {label}: expected {dict(wanted)}, recorded {dict(got)}")
        else:
            print(f"{'LATE' if label in delayed else 'OK'}: {label}")
    print(f"{'FAIL' if unverified else 'PASS'}: build {args.build}, "
          f"{len(unverified)}/{len(expected)} examples unverified, elapsed {elapsed:.1f}s")
    return 1 if unverified else 0


if __name__ == "__main__":
    sys.exit(main())

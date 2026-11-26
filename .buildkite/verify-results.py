#!/usr/bin/env python3
"""Check Test Engine result counts for an examples build."""

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
PIPELINE = f"{API}/organizations/buildkite/pipelines/bktest-examples"
SUITE = f"{API}/analytics/organizations/buildkite/suites/bktest-examples"
NO_RESULTS = {
    ":pipeline:", ":swift: XCUITest build and discover", ":android: Discover JVM tests",
    ":gradle: Discover Kotlin / Java tests",
    ":rspec: Plan RSpec pool", ":jest: Plan Jest pool", ":playwright: Plan Playwright pool",
    ":pytest: Plan pytest pool", ":pytest: Plan persistent pytest pool",
}
API_ERRORS = (OSError, ValueError, KeyError, TypeError)
next_request = 0
retry_deadline = float("inf")


def die(message):
    print(message, file=sys.stderr)
    raise SystemExit(2)


def get(url):
    global next_request
    request = Request(url, headers={
        "Accept": "application/json",
        "Authorization": f"Bearer {os.environ['BUILDKITE_API_TOKEN']}",
        "Buildkite-Version": "2026-08-01",
    })
    while True:
        time.sleep(max(0, next_request - time.monotonic()))
        next_request = time.monotonic() + 1.3  # Below 50 requests/minute.
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
                # Reset headers are delays in seconds.
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


def job_ids(build_number, verifier_job_id):
    jobs = {}
    found_verifier = False
    url = f"{PIPELINE}/builds/{build_number}/jobs?per_page=100&include_retried_jobs=false"
    while url:
        page, _ = get(url)
        for job in page["items"]:
            if job["type"] == "script" and not job.get("retried"):
                if job.get("step_key") == "verify-results":
                    found_verifier |= job["id"] == verifier_job_id
                    continue
                if not job.get("started_at") or (verifier_job_id and not job.get("finished_at")):
                    die(f"BUILD INCOMPLETE: {job['name']}: {job.get('state', 'not started')}")
                label = re.sub(r"XCUITest shard \d+", "XCUITest shard %n", job["name"])
                jobs.setdefault(label, []).append(job["id"])
        url = page["links"].get("next")
    if verifier_job_id and not found_verifier:
        die("BUILD INCOMPLETE: current job is not the verifier")
    return {label: ids for label, ids in jobs.items() if label not in NO_RESULTS}


def pool_fallbacks(build_number, jobs):
    fallbacks = set()
    for label, ids in jobs.items():
        if "(Test Scheduler pool" not in label:
            continue
        for job_id in ids:
            log, _ = get(f"{PIPELINE}/builds/{build_number}/jobs/{job_id}/log")
            content = log["content"]
            if not isinstance(content, str) or not content:
                raise ValueError(f"no log content for {label}: job {job_id}")
            if "Using local fallback" in content:
                print(f"FALLBACK: {label}: job {job_id} used a local split")
                fallbacks.add(label)
    return fallbacks


def recorded(build, job_id=None):
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
    parser.add_argument("build", type=int, help="examples build number")
    parser.add_argument("--timeout", type=float, default=600,
                        help="polling budget in seconds (default: 600)")
    parser.add_argument("--interval", type=float, default=60, help="seconds between checks (default: 60)")
    args = parser.parse_args(argv)
    if args.timeout < 0 or args.interval <= 0:
        parser.error("--timeout must be nonnegative and --interval must be positive")
    next_request = 0
    retry_deadline = time.monotonic() + args.timeout
    if not os.environ.get("BUILDKITE_API_TOKEN"):
        die("AUTH ERROR: set BUILDKITE_API_TOKEN to a token with read_builds, read_suites, and read_build_logs")
    expected = {label: +Counter(results) for label, results in
                json.loads(Path(__file__).with_name("expected-results.json").read_text()).items()}

    try:
        build, _ = get(f"{PIPELINE}/builds/{args.build}?exclude_jobs=true&exclude_pipeline=true")
        verifier_job_id = os.environ.get("BUILDKITE_JOB_ID") if os.environ.get("BUILDKITE_BUILD_ID") == build["id"] else None
        if not build.get("finished_at") and not verifier_job_id:
            die("BUILD NOT FINISHED: run this after every job has finished")
        jobs = job_ids(args.build, verifier_job_id)
    except API_ERRORS as error:
        die(f"API ERROR: cannot read build {args.build}: {error}")
    unknown = jobs.keys() - expected.keys()
    if unknown:
        die(f"CONFIG ERROR: steps without expectations: {sorted(unknown)}")
    missing = expected.keys() - jobs.keys()
    for label in sorted(missing):
        print(f"NOT RUN: {label}")
    if not jobs:
        die("BUILD INCOMPLETE: no examples to check")
    try:
        fallbacks = pool_fallbacks(args.build, jobs)
    except API_ERRORS as error:
        die(f"API ERROR: cannot read pool worker logs: {error}")
    expected = {label: expected[label] for label in jobs}
    wanted_total = sum(expected.values(), Counter())

    started = time.monotonic()
    retry_deadline = started + args.timeout
    while True:
        try:
            total = recorded(build)
            error = None
        except API_ERRORS as err:
            total, error = Counter(), err
        elapsed = time.monotonic() - started
        if (not error and not (wanted_total - total)) or elapsed + args.interval > args.timeout:
            break
        print(f"WAIT {elapsed:.1f}s: build totals expected {dict(wanted_total)}, recorded {dict(total)}", flush=True)
        time.sleep(args.interval)

    if error:
        die(f"API ERROR: {error}")
    counts, pending = {}, list(jobs)
    while True:
        error = None
        for label in pending:
            try:
                counts[label] = sum((recorded(build, job_id) for job_id in jobs[label]), Counter())
            except API_ERRORS as err:
                error = err
        pending = [label for label in jobs if label not in counts or expected[label] - counts[label]]
        if not pending or time.monotonic() + args.interval > retry_deadline:
            break
        print(f"WAIT: results still deficient for {pending}", flush=True)
        time.sleep(args.interval)
    if error:
        die(f"API ERROR: {error}")
    mismatches = {label for label in expected if counts[label] != expected[label]}
    for label, wanted in expected.items():
        if label in mismatches:
            got = counts[label]
            verdict = "MISSING" if not got else "DUPLICATE" if not (wanted - got) else "MISMATCH"
            print(f"{verdict}: {label}: expected {dict(wanted)}, recorded {dict(got)}")
        elif label not in fallbacks:
            print(f"OK: {label}")
    elapsed = time.monotonic() - started
    unverified = missing | fallbacks | mismatches
    print(f"{'FAIL' if unverified else 'PASS'}: build {args.build}, "
          f"{len(unverified)}/{len(expected) + len(missing)} examples unverified, elapsed {elapsed:.1f}s")
    if mismatches:
        print("Recorded counts (review before updating expected-results.json):")
        print(json.dumps({label: dict(got) for label, got in counts.items()}, indent=2))
    return 1 if unverified else 0


if __name__ == "__main__":
    sys.exit(main())

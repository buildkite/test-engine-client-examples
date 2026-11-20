#!/usr/bin/env python3
"""Check recorded Test Engine counts for a completed examples build."""

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
IGNORED = {":pipeline:", ":swift: XCUITest build and discover", ":android: Discover JVM tests"}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("build", type=int, nargs="?", help="Buildkite build number")
    parser.add_argument("--timeout", type=float, default=600, help="total timeout in seconds (default: 600)")
    parser.add_argument("--interval", type=float, default=60, help="seconds between polls (default: 60)")
    args = parser.parse_args(argv)
    if args.build is None:
        parser.print_help()
        return 0
    if args.build < 1 or not 0 < args.timeout < float("inf") or not 0 < args.interval < float("inf"):
        parser.error("build, timeout and interval must be positive finite numbers")
    token = os.environ.get("BUILDKITE_API_TOKEN")
    if not token:
        print("AUTH ERROR: set BUILDKITE_API_TOKEN with read_builds and read_suites", file=sys.stderr)
        return 2

    started = time.monotonic()
    deadline = started + args.timeout
    expected = json.loads(Path(__file__).with_name("expected-results.json").read_text())

    def get(url):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError("verification deadline reached")
        request = Request(url, headers={
            "Authorization": f"Bearer {token}", "Buildkite-Version": "2026-08-01",
        })
        try:
            with urlopen(request, timeout=min(30, remaining)) as response:
                return json.load(response), response.headers.get("Link", "")
        except HTTPError as error:
            # Never print request headers, credentials, or an arbitrary response body.
            if error.code in (401, 403):
                raise PermissionError(f"HTTP {error.code}; check token scopes and resource access") from None
            raise RuntimeError(f"HTTP {error.code}") from None

    def pages(url):
        while url:
            rows, link = get(url)
            if not isinstance(rows, list):
                raise ValueError("API returned a non-list collection")
            yield from rows
            match = re.search(r'<([^>]+)>; rel="next"', link)
            url = match[1] if match else None

    try:
        build, _ = get(f"{PIPELINE}/builds/{args.build}?exclude_jobs=true&exclude_pipeline=true")
        if not build.get("finished_at"):
            print("BUILD NOT FINISHED: run this check after all jobs have completed", file=sys.stderr)
            return 2
        jobs = {label: [] for label in expected}
        jobs_url = f"{PIPELINE}/builds/{args.build}/jobs?per_page=100&include_retried_jobs=false"
        while jobs_url:
            job_page, _ = get(jobs_url)
            for job in job_page["items"]:
                if job["type"] != "script" or job.get("retried"):
                    continue
                label = re.sub(r"XCUITest shard \d+", "XCUITest shard %n", job["name"])
                if label in IGNORED:
                    continue
                if label not in expected:
                    print(f"CONFIG ERROR: no expected counts for {label}", file=sys.stderr)
                    return 2
                jobs[label].append(job["id"])
            jobs_url = job_page["links"].get("next")
    except (OSError, RuntimeError, ValueError, KeyError, TypeError) as error:
        print(f"API/AUTH ERROR: cannot read build {args.build}: {error}", file=sys.stderr)
        return 2

    counts, errors, delayed = {}, {}, set()
    while True:
        errors = {}
        for label, ids in jobs.items():
            total = Counter()
            try:
                for job_id in ids:
                    query = urlencode({
                        "tags": f"build.id:{build['id']},build.job_id:{job_id}",
                        "min_timestamp": build["created_at"], "per_page": 100,
                    })
                    for test in pages(f"{SUITE}/tests?{query}"):
                        results = test["executions_count_by_result"]
                        if not isinstance(results, dict) or not all(
                            type(value) is int and value >= 0 for value in results.values()
                        ) or sum(results.values()) != test["executions_count"]:
                            raise ValueError("API returned invalid execution counts")
                        total.update(results)
                counts[label] = +total  # Omitted result kinds and explicit zeroes are equivalent.
            except PermissionError as error:
                print(f"AUTH ERROR: {label}: {error}", file=sys.stderr)
                return 2
            except (OSError, RuntimeError, ValueError, KeyError, TypeError) as error:
                errors[label] = str(error)

        failures = [label for label in expected if label in errors or not jobs[label]
                    or counts.get(label) != Counter(expected[label])]
        elapsed = time.monotonic() - started
        if not failures or time.monotonic() >= deadline:
            break
        delayed.update(failures)
        print(f"WAIT {elapsed:.1f}s: {len(failures)} examples not verified; polling again", flush=True)
        time.sleep(min(args.interval, max(0, deadline - time.monotonic())))
        if time.monotonic() >= deadline:
            break

    elapsed = time.monotonic() - started
    for label, wanted in expected.items():
        if label in errors:
            print(f"API ERROR: {label}: {errors[label]}")
        elif not jobs[label] or not sum(counts[label].values()):
            print(f"MISSING: {label}: expected {wanted}; no recorded results"
                  + (" (no jobs in build)" if not jobs[label] else ""))
        elif counts[label] != Counter(wanted):
            print(f"MISMATCH: {label}: expected {wanted}; recorded {dict(counts[label])}")
        else:
            print(f"{'LATE' if label in delayed else 'OK'}: {label}")
    print(f"{'FAIL' if failures else 'PASS'}: build {args.build}, "
          f"{len(failures)}/{len(expected)} examples unverified, elapsed {elapsed:.1f}s")
    return 2 if errors else (1 if failures else 0)


if __name__ == "__main__":
    sys.exit(main())

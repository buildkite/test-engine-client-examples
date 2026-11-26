import contextlib
import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlsplit


spec = importlib.util.spec_from_file_location("verify_results", Path(__file__).with_name("verify-results.py"))
verify = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verify)

JEST = ":jest: Jest (Retry Enabled)"
SWIFT = ":swift: XCUITest shard %n"
POOL = ":jest: Jest (Test Scheduler pool)"
EXPECTED = {JEST: {"passed": 10, "failed": 1}, SWIFT: {"passed": 2}}


class VerifyResultsTest(unittest.TestCase):
    def run_check(self, scenario="normal", *, pool_log=None):
        clock, calls, polls = [0], [], [0]
        breakdown_errors = [0]
        jest_label = JEST if pool_log is None else POOL
        expected = {jest_label: EXPECTED[JEST], SWIFT: EXPECTED[SWIFT]}

        def response(data, link=""):
            result = io.BytesIO(json.dumps(data).encode())
            result.headers = {"Link": link}
            return result

        def metrics(results):
            # BuildTestsController + TestMetricPresenter at 8960c22e, confirmed
            # via list_tests_for_build on build 1349: REST array, Link header,
            # passed/failed always present, other result keys only if nonzero.
            counts = {"passed": 0, "failed": 0, **results}
            return [{"id": "test-id", "name": "testStatus", "state": "enabled",
                     "executions_count": sum(counts.values()),
                     "executions_count_by_result": counts}]

        def jest_results():
            if scenario == "missing":
                return {}
            if scenario == "mismatch":
                return {"passed": 1, "failed": 10}
            if scenario == "redistributed":
                return {"passed": 9, "failed": 1}
            if scenario == "duplicate":
                return {"passed": 11, "failed": 1, "pending": 2}
            return EXPECTED[JEST]

        def open_url(request, **kwargs):
            url = request.full_url
            endpoint = urlsplit(url)
            calls.append((clock[0], endpoint.path, parse_qs(endpoint.query)))
            self.assertEqual((endpoint.scheme, endpoint.netloc), ("https", "api.buildkite.com"))
            self.assertEqual(request.get_header("Buildkite-version"), "2026-08-01")
            query = parse_qs(endpoint.query)
            build_path = "/v2/organizations/buildkite/pipelines/bktest-examples/builds/1349"
            if endpoint.path == build_path:
                self.assertEqual(query, {"exclude_jobs": ["true"], "exclude_pipeline": ["true"]})
                return response({"id": "build-id", "created_at": "2026-11-22T22:05:30.555Z",
                                 "finished_at": None if scenario == "unfinished" else "2026-11-22T22:08:57.022Z"})
            if endpoint.path == f"{build_path}/jobs":
                job_query = {"per_page": ["100"], "include_retried_jobs": ["false"]}
                jobs = [{"type": "script", "id": "retry", "name": jest_label, "started_at": "timestamp"},
                        {"type": "script", "id": "shard0", "name": SWIFT.replace("%n", "0"), "started_at": "timestamp"},
                        {"type": "script", "id": "shard1", "name": SWIFT.replace("%n", "1"), "started_at": "timestamp"},
                        {"type": "script", "id": "old", "name": JEST, "retried": True, "started_at": "timestamp"},
                        {"type": "script", "id": "discovery", "name": ":swift: XCUITest build and discover", "started_at": "timestamp"}]
                if scenario == "trimmed":
                    jobs = jobs[:1]
                if scenario == "empty":
                    jobs = jobs[-1:]
                if scenario in ("waiting_failed", "canceled", "expired", "skipped"):
                    for job in jobs[1:3]:
                        job.update(started_at=None, state=scenario)
                    jobs[-1]["state"] = "failed"
                if scenario == "unknown":
                    jobs.append({"type": "script", "id": "new", "name": "New example", "started_at": "timestamp"})
                # Jobs use a JSON envelope and cursor, unlike test metrics.
                if "after" not in query:
                    self.assertEqual(query, job_query)
                    return response({"items": jobs[:1], "links": {"next": f"{url}&after=next-cursor"}})
                self.assertEqual(query, {**job_query, "after": ["next-cursor"]})
                return response({"items": jobs[1:], "links": {}})
            if pool_log is not None and endpoint.path == f"{build_path}/jobs/retry/log":
                return response({"content": pool_log})

            suite_path = "/v2/analytics/organizations/buildkite/suites/bktest-examples/tests"
            build_totals = endpoint.path == "/v2/analytics/organizations/buildkite/builds/build-id/tests"
            if not build_totals:
                self.assertEqual(endpoint.path, suite_path)
                self.assertEqual(set(query), {"tags", "min_timestamp", "per_page"} | ({"page"} if "page" in query else set()))
                self.assertEqual(query["min_timestamp"], ["2026-11-22T22:05:30.555Z"])
                self.assertEqual(query["per_page"], ["100"])
            if build_totals or query["tags"] == ["build.id:build-id"]:
                if build_totals:
                    self.assertEqual(query, {"per_page": ["100"], **({"page": ["2"]} if "page" in query else {})})
                if build_totals and scenario == "post-finish-upload":
                    return response([])  # Receipt after finished_at is permanently excluded here.
                if "page" not in query:
                    polls[0] += 1
                    if scenario in ("retry-after", "user-reset", "http-date", "rate-limit", "two-limiters") and (polls[0] == 1 or scenario == "rate-limit"):
                        headers = {"Retry-After": "11", "RateLimit-User-Reset": "17"}
                        if scenario == "user-reset":
                            headers = {"RateLimit-User-Reset": "13"}
                        if scenario == "two-limiters":
                            headers = {"RateLimit-User-Remaining": "0", "RateLimit-User-Reset": "5",
                                       "RateLimit-Remaining": "150", "RateLimit-Reset": "59"}
                        if scenario == "http-date":
                            headers = {"Retry-After": "Sun, 22 Nov 2026 00:00:11 GMT"}
                        raise HTTPError(url, 429, "rate limited", headers, None)
                    if scenario in ("api", "auth") or (scenario == "transient" and polls[0] == 1):
                        raise HTTPError(url, 401 if scenario == "auth" else 503, "failure", {}, None)
                    if scenario == "not-a-list":
                        return response({})
                    if scenario in ("null-counts", "list-counts"):
                        return response([{"executions_count_by_result": None if scenario == "null-counts" else ["passed"]}])
                    results = {} if scenario == "late" and polls[0] == 1 else jest_results()
                    return response(metrics(results), f'<{url}&page=2>; rel="next", <{url}&page=2>; rel="last"')
                swift = {} if scenario == "trimmed" else {"passed": 3 if scenario == "redistributed" else 2}
                return response(metrics(swift))

            tags = query["tags"][0]
            if tags == "build.id:build-id,build.job_id:retry":
                return response(metrics(jest_results()))
            if tags == "build.id:build-id,build.job_id:shard0":
                if scenario == "stale-only" or (scenario == "old-attempt" and clock[0] < 10):
                    return response([])  # Totals already include a superseded attempt.
                # Two pages on one shard; the empty peer is valid.
                if "page" not in query:
                    return response(metrics({"passed": 1}), f'<{url}&page=2>; rel="next"')
                self.assertEqual(query["page"], ["2"])
                if scenario == "job-api" or (scenario == "job-transient" and not breakdown_errors[0]):
                    breakdown_errors[0] += 1
                    raise HTTPError(url, 503, "temporary failure", {}, None)
                return response(metrics({"passed": 2 if scenario == "redistributed" else 1}))
            self.assertEqual(tags, "build.id:build-id,build.job_id:shard1")
            return response([])

        def sleep(seconds):
            self.assertGreaterEqual(seconds, 0)
            clock[0] += seconds

        output = io.StringIO()
        with patch.dict("os.environ", {"BUILDKITE_API_TOKEN": "test-only"}), \
                patch.object(verify, "urlopen", open_url), \
                patch.object(verify.Path, "read_text", return_value=json.dumps(expected)), \
                patch.object(verify.time, "monotonic", side_effect=lambda: clock[0]), \
                patch.object(verify.time, "time", return_value=1795305600), \
                patch.object(verify.time, "sleep", side_effect=sleep), \
                contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            try:
                status = verify.main(["1349", "--timeout", "20", "--interval", "3"])
            except SystemExit as stop:
                status = stop.code
        return status, output.getvalue(), calls

    def test_combines_shards_pages_and_retry_outcomes(self):
        status, output, calls = self.run_check()
        self.assertEqual(status, 0)
        self.assertIn("PASS: build 1349, 0/2 examples unverified", output)
        self.assertIn(f"OK: {SWIFT}", output)
        self.assertEqual(len(calls), 9)  # Build + two job pages + two total pages + four breakdown pages.
        self.assertTrue(all(b[0] - a[0] >= 1.3 - 1e-9 for a, b in zip(calls, calls[1:])))

    def test_polls_only_build_totals_then_breaks_down_once(self):
        for scenario in ("late", "transient"):
            with self.subTest(scenario=scenario):
                status, output, calls = self.run_check(scenario)
                self.assertEqual(status, 0)
                self.assertIn("WAIT", output)
                self.assertEqual(sum("build.job_id:" in q.get("tags", [""])[0] for _, _, q in calls), 4)
                self.assertLessEqual(len(calls), 11)  # No per-job fan-out on either poll.
                self.assertEqual(sum(q.get("tags") == ["build.id:build-id"] and "page" not in q for _, _, q in calls), 2)

    def test_rate_limits_wait_and_retry_the_same_request(self):
        for scenario, delay in (("retry-after", 11), ("user-reset", 13), ("http-date", 11)):
            with self.subTest(scenario=scenario):
                status, output, calls = self.run_check(scenario)
                self.assertEqual(status, 0)
                self.assertIn("RATE LIMITED", output)
                self.assertNotIn("API ERROR", output)
                self.assertEqual(calls[3][1:], calls[4][1:])
                self.assertAlmostEqual(calls[4][0] - calls[3][0], delay)

    def test_repeated_rate_limits_are_bounded(self):
        status, output, calls = self.run_check("rate-limit")
        self.assertEqual(status, 2)
        self.assertIn("API ERROR", output)
        self.assertLess(len(calls), 10)
        # A retry that won't fit must stop, not retry early on the next poll.
        self.assertTrue(all(b[0] - a[0] >= 11 for a, b in zip(calls[3:], calls[4:])))

    def test_data_failures_include_pasteable_recorded_json(self):
        for scenario, verdict, results in (("missing", "MISSING", {}),
                                           ("mismatch", "MISMATCH", {"passed": 1, "failed": 10}),
                                           ("duplicate", "DUPLICATE", {"passed": 11, "failed": 1, "pending": 2}),
                                           ("redistributed", "MISMATCH", {"passed": 9, "failed": 1})):
            with self.subTest(scenario=scenario):
                status, output, calls = self.run_check(scenario)
                self.assertEqual(status, 1)
                self.assertIn(f"{verdict}: {JEST}", output)
                recorded = json.loads(output.split("Recorded counts (review before updating expected-results.json):\n")[1])
                self.assertEqual(recorded, {JEST: results, SWIFT: {"passed": 3 if scenario == "redistributed" else 2}})
                if scenario == "duplicate":
                    self.assertEqual(len(calls), 9)  # Over-counts don't wait for merges.
                if scenario == "mismatch":
                    self.assertIn("WAIT", output)  # Equal grand totals still hide a result deficit.
                    self.assertGreater(sum(q.get("tags") == ["build.id:build-id"] and "page" not in q
                                           for _, _, q in calls), 1)

    def test_missing_expected_step_fails_the_check(self):
        status, output, calls = self.run_check("trimmed")
        self.assertEqual(status, 1)
        self.assertIn(f"NOT RUN: {SWIFT}", output)
        self.assertIn("FAIL: build 1349, 1/2 examples unverified", output)
        self.assertEqual(sum("build.job_id:" in q.get("tags", [""])[0] for _, _, q in calls), 1)

    def test_pool_fallback_fails_even_when_counts_match(self):
        status, output, _ = self.run_check(pool_log="Using local fallback\n")
        self.assertEqual(status, 1, output)
        self.assertIn(f"FALLBACK: {POOL}", output)
        self.assertIn("FAIL: build 1349, 1/2 examples unverified", output)

        status, output, _ = self.run_check(pool_log="Acquired lease lease-id (10 tests)\n")
        self.assertEqual(status, 0, output)
        self.assertIn(f"OK: {POOL}", output)

    def test_present_but_unstarted_jobs_cannot_pass(self):
        for state in ("waiting_failed", "canceled", "expired", "skipped"):
            with self.subTest(state=state):
                status, output, _ = self.run_check(state)
                self.assertNotEqual(status, 0)
                self.assertIn("BUILD INCOMPLETE", output)
                self.assertIn(state, output)
                self.assertNotIn(f"NOT RUN: {SWIFT}", output)
                self.assertNotIn("PASS", output)

    def test_zero_examples_cannot_pass(self):
        status, output, _ = self.run_check("empty")
        self.assertNotEqual(status, 0)
        self.assertIn("BUILD INCOMPLETE: no examples to check", output)
        self.assertNotIn("PASS", output)

    def test_old_attempt_totals_do_not_end_waiting_for_current_jobs(self):
        status, output, calls = self.run_check("old-attempt")
        self.assertEqual(status, 0)
        self.assertIn("WAIT", output)
        self.assertEqual(sum(q.get("tags") == ["build.id:build-id,build.job_id:retry"] for _, _, q in calls), 1)
        self.assertEqual(sum(q.get("tags") == ["build.id:build-id,build.job_id:shard0"] for _, _, q in calls), 3)
        self.assertEqual(sum(q.get("tags") == ["build.id:build-id"] for _, _, q in calls), 2)
        self.assertEqual(len(calls), 11)

        status, output, calls = self.run_check("stale-only")
        self.assertEqual(status, 1)
        self.assertIn(f"MISSING: {SWIFT}", output)
        self.assertLessEqual(len(calls), 14)  # Retries share the original timeout.
        self.assertEqual(sum(q.get("tags") == ["build.id:build-id,build.job_id:retry"] for _, _, q in calls), 1)

    def test_transient_breakdown_error_retries_without_keeping_partial_counts(self):
        status, output, calls = self.run_check("job-transient")
        self.assertEqual(status, 0)
        self.assertIn("WAIT", output)
        self.assertIn("PASS: build 1349, 0/2 examples unverified", output)
        self.assertEqual(sum(q.get("tags") == ["build.id:build-id,build.job_id:retry"] for _, _, q in calls), 1)
        self.assertLessEqual(len(calls), 13)

    def test_rate_limit_ignores_unexhausted_org_reset(self):
        status, output, calls = self.run_check("two-limiters")
        self.assertEqual(status, 0)
        self.assertNotIn("API ERROR", output)
        self.assertEqual(calls[3][1:], calls[4][1:])
        self.assertAlmostEqual(calls[4][0] - calls[3][0], 5)

    def test_post_finish_uploads_are_polled_without_upper_bound(self):
        status, output, calls = self.run_check("post-finish-upload")
        self.assertEqual(status, 0)
        self.assertNotIn("WAIT", output)
        self.assertFalse(any("/builds/build-id/tests" in path for _, path, _ in calls))
        self.assertEqual(len(calls), 9)

    def test_api_errors_are_not_reported_as_missing_results(self):
        for scenario, verdict in (("api", "API ERROR"), ("auth", "AUTH ERROR"), ("not-a-list", "API ERROR"),
                                  ("null-counts", "API ERROR"), ("list-counts", "API ERROR"),
                                  ("unfinished", "BUILD NOT FINISHED"), ("job-api", "API ERROR")):
            with self.subTest(scenario=scenario):
                status, output, calls = self.run_check(scenario)
                self.assertEqual(status, 2)
                self.assertIn(verdict, output)
                self.assertNotIn("MISSING", output)
                self.assertNotIn("PASS", output)
                if scenario == "job-api":
                    self.assertLessEqual(len(calls), 14)

    def test_new_examples_cannot_silently_escape_verification(self):
        status, output, _ = self.run_check("unknown")
        self.assertEqual(status, 2)
        self.assertIn("CONFIG ERROR", output)
        self.assertIn("New example", output)


if __name__ == "__main__":
    unittest.main()

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


class VerifyResultsTest(unittest.TestCase):
    def run_check(self, scenario="normal"):
        clock = [0]

        def response(data, link=""):
            result = io.BytesIO(json.dumps(data).encode())
            result.headers = {"Link": link}
            return result

        def open_url(request, **kwargs):
            url = request.full_url
            endpoint = urlsplit(url)
            self.assertEqual((endpoint.scheme, endpoint.netloc), ("https", "api.buildkite.com"))
            query = parse_qs(endpoint.query)
            build_path = "/v2/organizations/buildkite/pipelines/test-engine-client-examples/builds/1303"
            if request.get_header("Buildkite-version") != "2026-08-01":
                raise HTTPError(url, 400, "metrics API version required", {}, None)
            if endpoint.path == build_path:
                self.assertEqual(query, {"exclude_jobs": ["true"], "exclude_pipeline": ["true"]})
                return response({"id": "build-id", "created_at": "2026-11-20T00:45:03Z",
                                 "finished_at": "2026-11-20T00:49:04Z"})
            if endpoint.path == f"{build_path}/jobs":
                job_query = {"per_page": ["100"], "include_retried_jobs": ["false"]}
                jobs = [{"type": "script", "id": "retry", "name": JEST},
                        {"type": "script", "id": "shard0", "name": SWIFT.replace("%n", "0")},
                        {"type": "script", "id": "shard1", "name": SWIFT.replace("%n", "1")},
                        {"type": "script", "id": "old", "name": JEST, "retried": True}]
                if scenario == "unknown":
                    jobs.append({"type": "script", "id": "new", "name": "New example"})
                # Jobs use a JSON envelope and cursor; tests use a list and Link header.
                if "after" not in query:
                    self.assertEqual(query, job_query)
                    return response({"items": jobs[:1], "links": {"next": f"{url}&after=next-cursor"}})
                self.assertEqual(query, {**job_query, "after": ["next-cursor"]})
                return response({"items": jobs[1:], "links": {}})
            self.assertEqual(endpoint.path, "/v2/analytics/organizations/buildkite/suites/test-engine-client-examples/tests")
            self.assertEqual(set(query), {"tags", "min_timestamp", "per_page"}
                             | ({"page"} if "page" in query else set()))
            self.assertEqual(query["min_timestamp"], ["2026-11-20T00:45:03Z"])
            self.assertEqual(query["per_page"], ["100"])
            if "page" in query:
                self.assertEqual(query["page"], ["2"])
            tags = query["tags"][0]
            if tags == "build.id:build-id,build.job_id:retry":
                if scenario in ("api", "auth") or (scenario == "transient" and clock[0] == 0):
                    raise HTTPError(url, 401 if scenario == "auth" else 503, "failure", {}, None)
                if scenario == "missing" or (scenario == "late" and clock[0] == 0):
                    return response([])
                if scenario == "not-a-list":
                    return response({})
                if scenario in ("null-counts", "list-counts"):
                    counts = None if scenario == "null-counts" else ["passed"] * 10 + ["failed"]
                    return response([{"executions_count": 11, "executions_count_by_result": counts}])
                results = {"passed": 1, "failed": 10} if scenario == "mismatch" else {"passed": 10, "failed": 1}
            elif tags == "build.id:build-id,build.job_id:shard0":
                # All tests may land on one shard; an empty peer is valid.
                results = {"passed": 1, "failed": 0}
                if "page" not in query:
                    return response([{"executions_count": 1, "executions_count_by_result": results}],
                                    f'<{url}&page=2>; rel="next"')
            elif tags == "build.id:build-id,build.job_id:shard1":
                return response([])
            else:
                raise AssertionError(f"incorrect job/build filter: {tags}")
            return response([{"executions_count": sum(results.values()), "executions_count_by_result": results}])

        def sleep(seconds):
            clock[0] += seconds

        output = io.StringIO()
        with patch.dict("os.environ", {"BUILDKITE_API_TOKEN": "test-only"}), \
                patch.object(verify, "urlopen", open_url), \
                patch.object(verify.Path, "read_text", return_value=json.dumps({
                    JEST: {"passed": 10, "failed": 1}, SWIFT: {"passed": 2},
                })), \
                patch.object(verify.time, "monotonic", side_effect=lambda: clock[0]), \
                patch.object(verify.time, "sleep", side_effect=sleep), \
                contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            try:
                status = verify.main(["1303", "--timeout", "2", "--interval", "1"])
            except SystemExit as stop:
                status = stop.code
        return status, output.getvalue()

    def test_combines_shards_pages_and_retry_outcomes(self):
        status, output = self.run_check()
        self.assertEqual(status, 0)
        self.assertIn("PASS: build 1303, 0/2 examples unverified", output)
        self.assertIn(f"OK: {SWIFT}", output)

    def test_late_results_pass_after_polling(self):
        for scenario in ("late", "transient"):
            with self.subTest(scenario=scenario):
                status, output = self.run_check(scenario)
                self.assertEqual(status, 0)
                self.assertIn(f"LATE: {JEST}", output)
                self.assertIn("elapsed 1.0s", output)

    def test_failing_verdicts_name_the_example(self):
        for scenario, verdict in [("missing", "MISSING"), ("mismatch", "MISMATCH")]:
            with self.subTest(scenario=scenario):
                status, output = self.run_check(scenario)
                self.assertEqual(status, 1)
                self.assertIn(f"{verdict}: {JEST}", output)
                self.assertIn("FAIL: build 1303, 1/2 examples unverified", output)

    def test_api_errors_are_not_reported_as_missing_results(self):
        for scenario, verdict in [("api", "API ERROR"), ("auth", "AUTH ERROR"), ("not-a-list", "API ERROR"),
                                  ("null-counts", "API ERROR"), ("list-counts", "API ERROR")]:
            with self.subTest(scenario=scenario):
                status, output = self.run_check(scenario)
                self.assertEqual(status, 2)
                self.assertIn(verdict, output)
                self.assertNotIn("MISSING", output)
                self.assertNotIn("PASS", output)

    def test_new_examples_cannot_silently_escape_verification(self):
        status, output = self.run_check("unknown")
        self.assertEqual(status, 2)
        self.assertIn("CONFIG ERROR", output)
        self.assertIn("New example", output)


if __name__ == "__main__":
    unittest.main()

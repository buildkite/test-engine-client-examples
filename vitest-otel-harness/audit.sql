-- READ ONLY. Not executed: confirm table/column types with DESCRIBE TABLE
-- test_engine_otel.otel_spans first. These names follow #93's schema-first SQL,
-- not a verified production schema. In particular, adapt ID-to-string/map
-- access if DESCRIBE shows different representations. FINAL avoids counting
-- unmerged ReplacingMergeTree versions as duplicate logical spans.
--
-- Exact production evidence: build 1088 / ce2baff607fb4b1388730715b303cf75f99ae876
-- Collector c604e8f1eb95bf83419781a3ea26d8a1f4a65f73, 1.14.0-beta.1.
-- Direct run 70c1b4c4-a00e-850c-9970-e2a502459cb4
-- Relay run  44b9a893-8bdd-8fb0-9a35-b6bea3decceb
-- Per run: 1680 roots (1500 pass / 150 fail / 30 skipped), 420 children,
-- 2100 spans, 120 nonempty Vitest phases, 30 rich trees with 12 children,
-- 30 concurrent trees with 2 children, 1620 root-only trees.
--
-- Expected manifest below is the exact contract checked against EVERY actual
-- export by verify.mjs, not a count inferred from successful HTTP responses.
-- Source artifacts in build1088, job01a1ae11-1419-455f-8aee-2f9f873ef685:
-- direct-forks-large/exports.jsonl SHA1 a8331b59f3748409bb94ca0e91b1817864016e3f
-- relay-forks-large/exports.jsonl  SHA1 c1b1cbc7bc5314996596ef2f90caf7ade35f46e2
-- Both are under vitest-otel-harness/tmp/ in Buildkite artifacts.
--
-- Expected output: exactly two "run totals" rows with actual=expected=2100.
-- ALL other rows are violations and must be absent. This checks all names,
-- statuses, child counts, parent resolution, orphans, empty phases and semantic
-- parent edges. It does not assert timing equality or replace the exported
-- span-ID equality checks in API samples. No INSERT/CREATE or external data.
WITH
  runs AS (
    SELECT arrayJoin(['70c1b4c4-a00e-850c-9970-e2a502459cb4',
                      '44b9a893-8bdd-8fb0-9a35-b6bea3decceb']) AS run
  ),
  expected AS (
    SELECT run, concat(if(i = 55, concat('skipped suite ', toString(f), ' '), ''),
      'case ', toString(f), multiIf(i < 50, ' pass ', i < 55, ' fail ', ' skip '),
      toString(multiIf(i < 50, i, i < 55, i - 50, 0))) AS test,
      multiIf(i < 50, 'pass', i < 55, 'fail', 'skipped') AS result,
      multiIf(i = 0, 12, i = 1, 2, 0) AS children
    FROM runs CROSS JOIN (SELECT number AS f FROM numbers(30)) AS files
      CROSS JOIN (SELECT number AS i FROM numbers(56)) AS cases
  ),
  s AS (
    SELECT toString(run_id) AS run, toString(trace_id) AS trace,
      toString(span_id) AS id, toString(parent_span_id) AS parent,
      span_name AS name, scope_name AS scope,
      span_attributes['test.case.name'] AS test,
      span_attributes['test.case.result.status'] AS result
    FROM test_engine_otel.otel_spans FINAL
    WHERE toString(source_build_id) = '01a1ae10-fa75-4d60-ba8b-d2909a8566e2'
      AND toString(run_id) IN (SELECT run FROM runs)
  ),
  traces AS (
    SELECT run, trace, countIf(name = 'test.execution') AS roots,
      countIf(name != 'test.execution') AS children
    FROM s GROUP BY run, trace
  ),
  actual AS (
    SELECT s.run AS run, s.test AS test, count() AS roots,
      any(s.result) AS result, sum(t.children) AS children
    FROM s INNER JOIN traces t ON s.run = t.run AND s.trace = t.trace
    WHERE s.name = 'test.execution' GROUP BY s.run, s.test
  ),
  parents AS (SELECT DISTINCT run, trace, id, name, scope FROM s),
  with_parents AS (
    SELECT c.*, p.id AS resolved_parent, p.name AS parent_name, p.scope AS parent_scope
    FROM s c LEFT JOIN parents p ON c.run = p.run AND c.trace = p.trace AND c.parent = p.id
  ),
  edges AS (SELECT DISTINCT run, trace, parent FROM s),
  checks AS (
    SELECT e.run AS run, concat('test manifest: ', e.test) AS check,
      toInt64(a.children) AS actual, toInt64(e.children) AS expected
    FROM expected e LEFT JOIN actual a ON e.run = a.run AND e.test = a.test
    WHERE a.roots != 1 OR a.result != e.result OR a.children != e.children
    UNION ALL
    SELECT a.run, concat('unknown test: ', a.test), toInt64(a.roots), toInt64(0)
    FROM actual a LEFT JOIN expected e ON a.run = e.run AND a.test = e.test
    WHERE e.test = ''
    UNION ALL
    SELECT run, concat('roots in trace: ', trace), toInt64(roots), toInt64(1)
    FROM traces WHERE roots != 1
    UNION ALL
    SELECT run, concat('unresolved parent: ', id), toInt64(1), toInt64(0)
    FROM with_parents WHERE name != 'test.execution' AND resolved_parent = ''
    UNION ALL
    SELECT run, concat('parented execution root: ', id), toInt64(1), toInt64(0)
    FROM s WHERE name = 'test.execution' AND parent NOT IN ('', '0000000000000000')
    UNION ALL
    SELECT p.run, concat('empty phase: ', p.id), toInt64(1), toInt64(0)
    FROM s p LEFT JOIN edges e ON p.run = e.run AND p.trace = e.trace AND p.id = e.parent
    WHERE p.scope = 'vitest' AND e.parent = ''
    UNION ALL
    SELECT run, concat('wrong parent edge: ', name, '/', id), toInt64(1), toInt64(0)
    FROM with_parents WHERE name != 'test.execution' AND NOT (
      (scope = 'vitest' AND parent_name = 'test.execution'
        AND name IN ('vitest.test.runner.test.beforeEach', 'vitest.test.runner.test.afterEach', 'vitest.test.runner.test.callback'))
      OR (name = 'hook-before' AND parent_name = 'vitest.test.runner.test.beforeEach')
      OR (name = 'hook-after' AND parent_name = 'vitest.test.runner.test.afterEach')
      OR (name IN ('body-manual', 'concurrent-manual') AND parent_name = 'vitest.test.runner.test.callback')
      OR (name = 'server-handler' AND parent_scope = '@opentelemetry/instrumentation-http')
      OR (scope IN ('@opentelemetry/instrumentation-http', '@opentelemetry/instrumentation-undici')
        AND parent_name = 'vitest.test.runner.test.callback')
      OR (scope = '@opentelemetry/instrumentation-http'
        AND parent_scope IN ('@opentelemetry/instrumentation-http', '@opentelemetry/instrumentation-undici'))
    )
    UNION ALL
    SELECT run, 'duplicate logical span IDs', toInt64(count() - uniqExact(tuple(trace,id))), toInt64(0)
    FROM s GROUP BY run HAVING count() != uniqExact(tuple(trace,id))
    UNION ALL
    SELECT run, 'run totals', toInt64(count()), toInt64(2100)
    FROM s GROUP BY run
    UNION ALL
    SELECT r.run, 'missing run', toInt64(0), toInt64(2100)
    FROM runs r LEFT JOIN (SELECT DISTINCT run FROM s) a ON r.run = a.run WHERE a.run = ''
    UNION ALL
    SELECT run, 'root count', toInt64(countIf(name = 'test.execution')), toInt64(1680)
    FROM s GROUP BY run HAVING countIf(name = 'test.execution') != 1680
    UNION ALL
    SELECT run, 'phase count', toInt64(countIf(scope = 'vitest')), toInt64(120)
    FROM s GROUP BY run HAVING countIf(scope = 'vitest') != 120
  )
SELECT * FROM checks ORDER BY run, check SETTINGS join_use_nulls = 0;

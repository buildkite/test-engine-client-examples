#!/usr/bin/env python3
"""Verification branch only: five blocked repetitions, never retry until green."""
import collections
import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import xml.etree.ElementTree as ET

root = Path('/workdir/.nowinandroid')
os.chdir(root)
block = int(os.environ['BUILDKITE_PARALLEL_JOB'])
output = root/'diagnosis'/f'block-{block}'
output.mkdir(parents=True)
gradle = ['./gradlew', '--no-daemon', '--no-configuration-cache', '--console=plain',
          '--info', '--continue', '--max-workers=4',
          '--init-script', '/workdir/.buildkite/nia-diagnosis.init.gradle']
native_env = dict(os.environ)
for name in ['BUILDKITE_ANALYTICS_TOKEN', 'BUILDKITE_TEST_ENGINE_API_ACCESS_TOKEN']:
    native_env.pop(name, None)

# Dry-run discovery is setup, never one of the 20 measured test invocations.
subprocess.run(gradle + ['splitTests', '-PdiscoverTests',
                       '-PsplitTestTask=testDemoDebugUnitTest'], env=native_env, check=True)
selectors = Path('/workdir/.buildkite/nia-diagnosis-selectors.txt').read_text().splitlines()
assert len(selectors) == len(set(selectors)) == 17
owner = {}
for manifest in root.rglob('build/test-selectors/testDemoDebugUnitTest.txt'):
    module = manifest.parent.parent.parent.relative_to(root).as_posix().replace('/', ':')
    for selector in manifest.read_text().splitlines():
        if not selector:
            continue
        assert selector not in owner
        owner[selector] = ':'+module+':testDemoDebugUnitTest'
assert set(selectors) <= owner.keys()
by_task = collections.defaultdict(list)
for selector in selectors:
    by_task[owner[selector]].append(selector)
filtered = list(gradle)
for task, classes in sorted(by_task.items()):
    filtered.append(task)
    for name in classes:
        filtered.extend(['--tests', name])
interest = 'com.google.samples.apps.nowinandroid.ui.InterestsListDetailScreenTest'
commands = {
    'a-full-native': gradle + ['testDemoDebugUnitTest'],
    'b-alone-native': gradle + [owner[interest], '--tests', interest],
    'c-shard-native': filtered,
    'd-shard-bktec': ['bktec', 'run', '--plan-out', str(output/'plan.json')],
}
# Fixed selectors and parallelism=1 pin exactly #1201's node-1 assignment. The
# command is intentionally identical to c: isolate bktec from Gradle selection.
fixed = output/'selectors.txt'
fixed.write_text('\n'.join(selectors)+'\n')
bktec_env = dict(os.environ)
bktec_env.update({
    'BUILDKITE_PARALLEL_JOB': '0', 'BUILDKITE_PARALLEL_JOB_COUNT': '1',
    'BUILDKITE_TEST_ENGINE_SELECTOR_FILE': str(fixed),
    'BUILDKITE_TEST_ENGINE_TEST_CMD': shlex.join(
        ['env', '-u', 'BUILDKITE_ANALYTICS_TOKEN', '-u', 'BUILDKITE_TEST_ENGINE_API_ACCESS_TOKEN'] + filtered),
})
modes = list(commands)
order = modes[block % 4:] + modes[:block % 4]
summary = []
for mode in order:
    # Clear reports, not compiled classes; force Test tasks through the init script.
    for directory in root.rglob('build/test-results'):
        if output.parent not in directory.parents:
            shutil.rmtree(directory)
    destination = output/mode
    destination.mkdir()
    argv = commands[mode]
    print('NIA_DIAGNOSIS_START', block, mode, shlex.join(argv), flush=True)
    with (destination/'run.log').open('w') as log:
        result = subprocess.run(argv, env=bktec_env if mode.startswith('d-') else native_env,
                                stdout=log, stderr=subprocess.STDOUT)
    rows = []
    for xml in root.rglob('build/test-results/**/TEST-*.xml'):
        if output.parent in xml.parents:
            continue
        target = destination/xml.relative_to(root)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(xml, target)
        for case in ET.parse(xml).getroot().iter('testcase'):
            status = ('failed' if case.find('failure') is not None or case.find('error') is not None
                      else 'skipped' if case.find('skipped') is not None else 'passed')
            rows.append([case.get('classname'), case.get('name'), status])
    assert len(rows) == len({tuple(row[:2]) for row in rows}), (mode, 'duplicate identity')
    assert len(rows) == {'a-full-native': 143, 'b-alone-native': 6,
                         'c-shard-native': 60, 'd-shard-bktec': 60}[mode], (mode, len(rows))
    if mode.startswith(('c-', 'd-')):
        assert {row[0] for row in rows} == set(selectors), (mode, 'wrong classes')
    text = (destination/'run.log').read_text()
    forks = [line for line in text.splitlines() if 'NIA_FORK_POLICY' in line
             or "Starting process 'Gradle Test Executor" in line]
    assert forks, 'missing fork evidence'
    record = dict(block=block, mode=mode, exit_status=result.returncode,
                  command=argv, rows=rows, forks=forks,
                  bktec_test_cmd=bktec_env['BUILDKITE_TEST_ENGINE_TEST_CMD'] if mode.startswith('d-') else None)
    (destination/'result.json').write_text(json.dumps(record, indent=2)+'\n')
    print('NIA_DIAGNOSIS_RESULT', json.dumps({**record, 'rows': [row for row in rows if row[0] == interest]}), flush=True)
    assert result.returncode == (1 if any(row[2] == 'failed' for row in rows) else 0)
    if mode.startswith('d-'):
        plan = json.loads((output/'plan.json').read_text())
        assert plan['parallelism'] == 1
        assert {test['value'] for test in plan['tasks']['0']['tests']} == set(selectors)
    summary.append(record)
(output/'summary.json').write_text(json.dumps(summary, indent=2)+'\n')
print('NIA_DIAGNOSIS_BLOCK_COMPLETE', block, flush=True)

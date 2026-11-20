# pytest tag filters

Run only the pytest tests matching an execution tag, such as `component:frontend`.

## Pipeline

```yaml
steps:
  - label: ":pytest: pytest (tag filters)"
    parallelism: 2
    commands:
      - pip install -e '.[dev]'
      - bktec run
    plugins:
      - tests#v1.1.0:
          test-runner: pytest
          tag-filters: "component:frontend"
          suite-slug: your-suite-slug
          upload-results: false
          client-version: "3.5.0"
```

Set `tag-filters` to the tests you want to run. The Python test collector uploads results, so set `upload-results: false`. Add an [OIDC policy](https://buildkite.com/docs/pipelines/configure/tests/test-collection/oidc) to your test suite so your pipeline can authenticate. Our `pytest (tag filters)` step is in [pipeline.yml](../.buildkite/pipeline.yml).

## Test collector

Add `buildkite-test-collector` to your test dependencies, as in [setup.py](./setup.py), and tag your tests:

```python
@pytest.mark.execution_tag("component", "frontend")
def test_user_login():
    assert True
```

## Run locally

Use Python from `mise.toml` and an activated virtual environment in this directory. Direct pytest runs include all tests; bktec applies the tag filter in CI.

```bash
pip install -e '.[dev]'
pytest
```

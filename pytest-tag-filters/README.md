# pytest tag filters

Run only the pytest tests with an execution tag, such as `component:frontend`, split across parallel jobs with bktest.

## Pipeline

Copy the `pytest (tag filters)` step from [pipeline.yml](../.buildkite/pipeline.yml) and [adapt it](../README.md#adapt-a-step). Set `tag-filters` to the tag to run. bktest applies the filter through the Python test collector, so the collector is required.

## Test collector

Add `buildkite-test-collector` to your test dependencies, as in [setup.py](./setup.py), and tag your tests:

```python
@pytest.mark.execution_tag("component", "frontend")
def test_user_login():
    assert True
```

See [execution tags](https://buildkite.com/docs/pipelines/configure/tests/test-collection/python-collectors#pytest-collector-upload-custom-tags-for-test-executions).

## Run locally

Use Python from `mise.toml` and run these commands from this directory. Running pytest directly runs every test; only bktest applies the filter.

```bash
pip install -e '.[dev]'
pytest
```

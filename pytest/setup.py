# setup.py
from setuptools import setup

setup(
  name="buildkite-test-engine-client-pytest-example",
  version="0.1",
  install_requires=[],
  extras_require={
    "dev": [
      "pytest>=7.0.0",
      "buildkite-test-collector @ git+https://github.com/buildkite/test-collector-python.git@failure-expanded",
    ],
  },
)

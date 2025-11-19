# setup.py
from setuptools import setup

setup(
  name="buildkite-test-engine-client-pytest-xdist-example",
  version="0.1",
  install_requires=[],
  extras_require={
    "dev": [
      "pytest==8.4.2",
      "pytest-xdist==3.8.0",
      "pytest-rerunfailures",
      "buildkite-test-collector>=1.1.0",
    ],
  },
)

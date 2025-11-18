# setup.py
from setuptools import setup

setup(
  name="buildkite-test-engine-client-pytest-xdist-example",
  version="0.1",
  install_requires=[],
  extras_require={
    "dev": [
      "pytest>=7.0.0",
      "pytest-xdist>=3.0.0",
      "buildkite-test-collector>=1.1.0",
    ],
  },
)

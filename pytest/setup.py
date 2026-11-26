# setup.py
from setuptools import setup

setup(
  name="bktest-examples-pytest",
  version="0.1",
  install_requires=[],
  extras_require={
    "dev": [
      "pytest>=7.0.0",
      "pytest-xdist>=3.0.0",
      "buildkite-test-collector==1.10.0",
    ],
  },
)

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
      "pytest-rerunfailures==12.0",
      "pytest-repeat==0.9.4",
      "buildkite-test-collector==1.1.1",
      "pytest-asyncio==1.2.0",
      "pytest-timeout==2.4.0",
      "anyio==4.11.0",
      "langsmith==0.4.39",
      "ddtrace==3.17.2",
    ],
  },
)

from setuptools import setup

setup(
  name="bktest-examples-pytest",
  version="0.1",
  extras_require={
    "dev": [
      "pytest==9.2.0",
      "pytest-xdist==3.8.0",
      "buildkite-test-collector==1.10.0",
    ],
  },
)

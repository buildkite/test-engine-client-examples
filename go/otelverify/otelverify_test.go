// Package otelverify exists only on the OTel verification branch: it gives
// the run a failing test, a skipped test and subtests so the counts the
// buildkite-test-collector command reports can be checked against go test.
package otelverify

import "testing"

func TestDeliberateFailure(t *testing.T) {
	t.Errorf("this test fails on purpose: got %d, want %d", 4, 5)
}

func TestDeliberateSkip(t *testing.T) {
	t.Skip("this test is skipped on purpose")
}

func TestSubtests(t *testing.T) {
	t.Run("even", func(t *testing.T) {
		if 10%2 != 0 {
			t.Error("10 is even")
		}
	})
	t.Run("odd", func(t *testing.T) {
		t.Parallel()
		if 7%2 != 1 {
			t.Error("7 is odd")
		}
	})
}

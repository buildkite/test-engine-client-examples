package textutil

import (
	"os"
	"testing"

	bktest "github.com/buildkite/bktest/test-collector-go"
)

func TestMain(m *testing.M) {
	os.Exit(bktest.Main(m, bktest.WithTags(map[string]string{"language.name": "go", "test.framework.name": "go-test"})))
}

func TestNormalize(t *testing.T) {
	bktest.Start(t)
	if got := Normalize("  Buildkite  "); got != "buildkite" {
		t.Fatalf("Normalize() = %q, want %q", got, "buildkite")
	}
}

func TestIsPalindrome(t *testing.T) {
	bktest.Start(t)
	if !IsPalindrome("Racecar") {
		t.Fatal("Racecar should be a palindrome")
	}
}

func TestIsNotPalindrome(t *testing.T) {
	bktest.Start(t)
	if IsPalindrome("pipeline") {
		t.Fatal("pipeline should not be a palindrome")
	}
}

// TestDeliberateSkip skips on purpose so the Test Engine run always contains
// a skipped execution.
func TestDeliberateSkip(t *testing.T) {
	bktest.Start(t)
	t.Skip("skipped on purpose")
}

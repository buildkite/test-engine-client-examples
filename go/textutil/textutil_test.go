package textutil

import "testing"

func TestNormalize(t *testing.T) {
	if got := Normalize("  Buildkite  "); got != "buildkite" {
		t.Fatalf("Normalize() = %q, want %q", got, "buildkite")
	}
}

func TestIsPalindrome(t *testing.T) {
	if !IsPalindrome("Racecar") {
		t.Fatal("Racecar should be a palindrome")
	}
}

func TestIsNotPalindrome(t *testing.T) {
	if IsPalindrome("pipeline") {
		t.Fatal("pipeline should not be a palindrome")
	}
}

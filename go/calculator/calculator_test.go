package calculator

import "testing"

func TestAdd(t *testing.T) {
	if got := Add(2, 3); got != 5 {
		t.Fatalf("Add(2, 3) = %d, want 5", got)
	}
}

func TestDivide(t *testing.T) {
	got, ok := Divide(12, 3)
	if !ok {
		t.Fatal("Divide(12, 3) reported division failure")
	}
	if got != 4 {
		t.Fatalf("Divide(12, 3) = %d, want 4", got)
	}
}

func TestDivideByZero(t *testing.T) {
	if _, ok := Divide(12, 0); ok {
		t.Fatal("Divide(12, 0) succeeded, want failure")
	}
}

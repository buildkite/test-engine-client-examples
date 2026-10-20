package calculator

import (
	"context"
	"os"
	"testing"

	bktest "github.com/buildkite/bktest/test-collector-go"
	"github.com/buildkite/test-engine-client-examples/go-otel/internal/testhelper"
	"go.opentelemetry.io/otel"
)

func TestMain(m *testing.M) {
	os.Exit(bktest.Main(m, bktest.WithTags(map[string]string{"language.name": "go", "test.framework.name": "go-test"})))
}

func TestAdd(t *testing.T) {
	ctx := bktest.Start(t)
	_, span := otel.Tracer("calculator").Start(ctx, "calculator.add")
	got := Add(2, 3)
	span.End()
	if got != 5 {
		t.Fatalf("Add(2, 3) = %d, want 5", got)
	}
}

func TestDivide(t *testing.T) {
	bktest.Start(t)
	got, ok := Divide(12, 3)
	if !ok {
		t.Fatal("Divide(12, 3) reported division failure")
	}
	if got != 4 {
		t.Fatalf("Divide(12, 3) = %d, want 4", got)
	}
}

// TestDivideByZero starts through the helper package, and its subtest is
// created there too: both must still be reported under this package.
func TestDivideByZero(t *testing.T) {
	testhelper.Start(t)
	if _, ok := Divide(12, 0); ok {
		t.Fatal("Divide(12, 0) succeeded, want failure")
	}
	testhelper.RunCase(t, "negative", func(ctx context.Context, t *testing.T) {
		if _, ok := Divide(-12, 0); ok {
			t.Fatal("Divide(-12, 0) succeeded, want failure")
		}
	})
}

func TestDivideTable(t *testing.T) {
	bktest.Start(t)
	cases := []struct {
		name string
		a, b int
		want int
	}{
		{"even", 10, 2, 5},
		{"truncates", 7, 2, 3},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			bktest.Start(t)
			bktest.Tag(t, "case", tc.name)
			if got, _ := Divide(tc.a, tc.b); got != tc.want {
				t.Errorf("Divide(%d, %d) = %d, want %d", tc.a, tc.b, got, tc.want)
			}
		})
	}
}

// TestDeliberateFailure fails on purpose so the Test Engine run always
// contains a failed execution.
func TestDeliberateFailure(t *testing.T) {
	testhelper.Start(t)
	bktest.Annotate(t, "this test fails on purpose")
	if got := Add(2, 2); got != 5 {
		t.Errorf("Add(2, 2) = %d, want 5 (deliberate failure)", got)
	}
}

// TestCleanupFailure fails from a cleanup registered before Start, which
// runs after Start's own cleanup; the reported result must still be fail.
func TestCleanupFailure(t *testing.T) {
	t.Cleanup(func() {
		t.Error("failed in a cleanup registered before Start (deliberate failure)")
	})
	testhelper.Start(t)
	if got := Add(1, 1); got != 2 {
		t.Errorf("Add(1, 1) = %d, want 2", got)
	}
}

// Package testhelper wraps bktest the way a suite's shared test utilities
// would. A test started through it must keep its own package as the scope
// and its own file as the location, so switching between the bktest
// package and the buildkite-test-collector command does not change test
// identities.
package testhelper

import (
	"context"
	"testing"

	bktest "github.com/buildkite/bktest/test-collector-go"
)

// Start is bktest.Start called from another package.
func Start(t *testing.T) context.Context {
	t.Helper()
	return bktest.Start(t)
}

// RunCase runs fn as a subtest that is started from this package.
func RunCase(t *testing.T, name string, fn func(ctx context.Context, t *testing.T)) {
	t.Helper()
	t.Run(name, func(t *testing.T) {
		fn(bktest.Start(t), t)
	})
}

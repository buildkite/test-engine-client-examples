package textutil

import (
	"testing"

	bktest "github.com/buildkite/bktest/test-collector-go"
	"go.opentelemetry.io/otel"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
	"go.opentelemetry.io/otel/trace"
)

// This file sorts before textutil_test.go, so this is the package's first
// test: it installs a tracer provider of its own to assert on its spans
// before the first bktest.Start sets the collector up, and the collector
// must leave that provider in place.
func TestOwnTracerProvider(t *testing.T) {
	recorder := tracetest.NewSpanRecorder()
	own := sdktrace.NewTracerProvider(sdktrace.WithSpanProcessor(recorder))
	prev := otel.GetTracerProvider()
	otel.SetTracerProvider(own)
	t.Cleanup(func() { otel.SetTracerProvider(prev) })

	ctx := bktest.Start(t)
	if otel.GetTracerProvider() != trace.TracerProvider(own) {
		t.Fatalf("the test's tracer provider was replaced with %T", otel.GetTracerProvider())
	}
	_, span := otel.Tracer("textutil").Start(ctx, "textutil.own")
	span.End()

	var names []string
	for _, s := range recorder.Ended() {
		names = append(names, s.Name())
	}
	if len(names) != 1 || names[0] != "textutil.own" {
		t.Fatalf("the test's tracer provider saw %v, want only textutil.own", names)
	}
}

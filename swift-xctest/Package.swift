// swift-tools-version: 5.9
import Foundation
import PackageDescription

// BKTEST_COLLECTOR_PATH points at a local checkout of
// buildkite/bktest/test-collector-swift so a build can exercise an unreleased
// collector. SwiftPM cannot resolve a package in a repository subdirectory by
// URL, so the pipeline clones bktest and sets this variable.
let collector: Package.Dependency
if let path = ProcessInfo.processInfo.environment["BKTEST_COLLECTOR_PATH"] {
    collector = .package(path: path)
} else {
    collector = .package(url: "https://github.com/buildkite/test-collector-swift", from: "0.6.0")
}

let package = Package(
    name: "swift-xctest",
    platforms: [
        .macOS(.v12)
    ],
    products: [
        .library(name: "ExampleLib", targets: ["ExampleLib"])
    ],
    dependencies: [
        collector
    ],
    targets: [
        .target(
            name: "ExampleLib",
            dependencies: []
        ),
        .testTarget(
            name: "ExampleLibTests",
            dependencies: [
                "ExampleLib",
                .product(name: "BuildkiteTestCollector", package: "test-collector-swift")
            ]
        )
    ]
)

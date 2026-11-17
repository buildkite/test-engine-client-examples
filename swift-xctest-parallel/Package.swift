// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftPackageExample",
    platforms: [.macOS(.v12)],
    dependencies: [
        .package(url: "https://github.com/buildkite/test-collector-swift", exact: "2.0.0-beta.3")
    ],
    targets: [
        .testTarget(
            name: "PackageTests",
            dependencies: [.product(name: "BuildkiteTestCollector", package: "test-collector-swift")]
        )
    ]
)

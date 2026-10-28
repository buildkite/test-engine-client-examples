// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "swift-xctest",
    platforms: [
        .macOS(.v12)
    ],
    products: [
        .library(name: "ExampleLib", targets: ["ExampleLib"])
    ],
    dependencies: [
        .package(url: "https://github.com/buildkite/test-collector-swift", exact: "2.0.0-beta.2")
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

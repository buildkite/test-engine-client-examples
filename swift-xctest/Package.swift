// swift-tools-version: 5.9
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
        .package(url: "https://github.com/buildkite/test-collector-swift", from: "0.6.0")
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

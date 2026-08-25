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
        .package(path: "../.bktest/test-collector-swift")
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

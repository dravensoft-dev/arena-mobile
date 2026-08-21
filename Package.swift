// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "ArenaTokens",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(name: "ArenaTokens", targets: ["ArenaTokens"])
    ],
    targets: [
        .target(
            name: "ArenaTokens",
            path: "swiftui/Sources/ArenaTokens"
        ),
        .testTarget(
            name: "ArenaTokensTests",
            dependencies: ["ArenaTokens"],
            path: "swiftui/Tests/ArenaTokensTests"
        )
    ]
)

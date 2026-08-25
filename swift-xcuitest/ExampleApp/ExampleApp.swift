import SwiftUI

@main
struct ExampleApp: App {
    var body: some Scene {
        WindowGroup {
            Text("Swift XCUITest example")
                .accessibilityIdentifier("status")
                .padding()
        }
    }
}

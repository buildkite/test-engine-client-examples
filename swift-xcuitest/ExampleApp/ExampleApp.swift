import Foundation
import SwiftUI

@main
struct ExampleApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

private struct ContentView: View {
    private let runID: String
    @State private var runnerCrashRecorded: Bool

    init() {
        let runID = ProcessInfo.processInfo.environment["XCUITEST_RUN_ID"] ?? "local"
        self.runID = runID
        self._runnerCrashRecorded = State(
            initialValue: UserDefaults.standard.string(forKey: "runner-crash-run-id") == runID
        )
    }

    var body: some View {
        VStack {
            Text("Swift XCUITest example")
                .accessibilityIdentifier("status")

            if runnerCrashRecorded {
                Text("Runner crash recorded")
                    .accessibilityIdentifier("runner-crash-recorded")
            } else {
                Button("Record runner crash") {
                    UserDefaults.standard.set(runID, forKey: "runner-crash-run-id")
                    UserDefaults.standard.synchronize()
                    runnerCrashRecorded = true
                }
                .accessibilityIdentifier("record-runner-crash")
            }
        }
        .padding()
    }
}

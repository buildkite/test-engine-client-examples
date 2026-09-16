import Core
import Darwin
import XCTest

final class ExampleAppUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func test01AppLaunches() {
        let app = launchApp()

        XCTAssertTrue(app.staticTexts["status"].waitForExistence(timeout: 5))
    }

    func test02ExecutionTag() {
        tagExecution("custom.tag.from", "execution")

        let app = launchApp()

        XCTAssertEqual(app.staticTexts["status"].label, "Swift XCUITest example")
    }

    func test03RunnerCrashesOnce() {
        let app = launchApp()

        if app.buttons["record-runner-crash"].waitForExistence(timeout: 2) {
            app.buttons["record-runner-crash"].tap()
            XCTAssertTrue(app.staticTexts["runner-crash-recorded"].waitForExistence(timeout: 2))

            _ = kill(getpid(), SIGKILL)
            XCTFail("The runner process should have terminated")
        }

        XCTAssertTrue(app.staticTexts["runner-crash-recorded"].waitForExistence(timeout: 2))
    }

    func test04RunsInReplacementRunner() {
        let app = launchApp()

        XCTAssertTrue(app.staticTexts["runner-crash-recorded"].waitForExistence(timeout: 5))
    }

    func test05ExecutionTagAfterRestart() {
        tagExecution("runner.replacement", "true")

        let app = launchApp()
        XCTAssertTrue(app.staticTexts["status"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["status"].label, "Swift XCUITest example")
    }

    private func launchApp() -> XCUIApplication {
        let app = XCUIApplication()
        let runID = ProcessInfo.processInfo.environment["XCUITEST_RUN_ID"] ?? "local"
        app.launchEnvironment["XCUITEST_RUN_ID"] = runID
        app.launch()
        return app
    }
}

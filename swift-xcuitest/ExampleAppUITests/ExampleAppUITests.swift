import Core
import XCTest

// Match the native identifiers in bin/build, including Objective-C class names.
// In this project the test target and Swift module are both ExampleAppUITests.
class SplitUITestCase: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
        let test = name.dropFirst(2).dropLast().split(separator: " ", maxSplits: 1)
        let runtimeClass = NSStringFromClass(type(of: self))
        var selector = "ExampleAppUITests/\(runtimeClass.split(separator: ".").last!)"
        if ProcessInfo.processInfo.environment["TEST_SPLIT_BY"] == "method" {
            // Xcode uses Swift method() spelling for Module.Class, but bare
            // Objective-C selectors for custom/mangled runtime class names.
            selector += "/\(test[1])\(runtimeClass.contains(".") ? "()" : "")"
        }
        tagExecution("test.selector.primary", selector)
        print("Execution selector: \(selector)")
    }
}

final class ExampleAppUITests: SplitUITestCase {
    func test01AppLaunches() {
        let app = XCUIApplication()
        app.launch()

        XCTAssertTrue(app.staticTexts["status"].waitForExistence(timeout: 5))
    }

    func test02ExecutionTag() {
        tagExecution("custom.tag.from", "execution")

        let app = XCUIApplication()
        app.launch()

        XCTAssertEqual(app.staticTexts["status"].label, "Swift XCUITest example")
    }
}

final class LaunchTests: SplitUITestCase {
    func testLaunch() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.staticTexts["status"].exists)
    }
}

final class StatusTests: SplitUITestCase {
    func testStatus() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertEqual(app.staticTexts["status"].label, "Swift XCUITest example")
    }
}

final class SlowTests: SplitUITestCase {
    func testSlowFlow() {
        let app = XCUIApplication()
        app.launch()
        // Make timing-aware placement visibly different from a 2/2 class split.
        Thread.sleep(forTimeInterval: 45)
        XCTAssertTrue(app.staticTexts["status"].exists)
    }
}

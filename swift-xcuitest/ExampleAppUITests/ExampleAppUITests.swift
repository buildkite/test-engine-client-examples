import XCTest

final class ExampleAppUITests: XCTestCase {
    func test01AppLaunches() {
        let app = XCUIApplication()
        app.launch()

        XCTAssertTrue(app.staticTexts["status"].waitForExistence(timeout: 5))
    }

    func test02ExecutionTag() {
        let app = XCUIApplication()
        app.launch()

        XCTAssertEqual(app.staticTexts["status"].label, "Swift XCUITest example")
    }
}

final class LaunchTests: XCTestCase {
    func testLaunch() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.staticTexts["status"].exists)
    }
}

final class StatusTests: XCTestCase {
    func testStatus() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertEqual(app.staticTexts["status"].label, "Swift XCUITest example")
    }
}

final class SlowTests: XCTestCase {
    func testSlowFlow() {
        let app = XCUIApplication()
        app.launch()
        // Make timing-aware placement visibly different from a 2/2 class split.
        Thread.sleep(forTimeInterval: 45)
        XCTAssertTrue(app.staticTexts["status"].exists)
    }
}

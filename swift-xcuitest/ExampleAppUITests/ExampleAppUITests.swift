import XCTest

final class LaunchTests: XCTestCase {
    func testLaunch() {
        let app = XCUIApplication()
        app.launch()

        XCTAssertTrue(app.staticTexts["status"].waitForExistence(timeout: 5))
    }
}

final class StatusTests: XCTestCase {
    func testStatus() {
        let app = XCUIApplication()
        app.launch()

        XCTAssertEqual(app.staticTexts["status"].label, "Swift XCUITest example")
    }
}

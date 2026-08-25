import Core
import XCTest

final class ExampleAppUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

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

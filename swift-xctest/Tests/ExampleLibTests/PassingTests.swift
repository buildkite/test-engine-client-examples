import Core
import XCTest
@testable import ExampleLib

final class PassingTests: XCTestCase {
    func testAdd() throws {
        self.tagExecution("custom.tag.from", "execution")
        XCTAssertEqual(ExampleLib().add(1, 2), 3)
    }

    func testSubtract() throws {
        XCTAssertEqual(ExampleLib().subtract(10, 3), 7)
    }
}

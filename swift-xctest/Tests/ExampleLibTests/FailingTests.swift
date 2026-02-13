import XCTest
@testable import ExampleLib

final class FailingTests: XCTestCase {
    func testSubtractFails() throws {
        // Intentional failure for demo purposes
        XCTAssertEqual(ExampleLib().subtract(10, 3), 999)
    }
}

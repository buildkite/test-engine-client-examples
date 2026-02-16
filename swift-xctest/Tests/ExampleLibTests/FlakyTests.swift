import XCTest

final class FlakyTests: XCTestCase {
    func testFlaky() throws {
        XCTAssertTrue(Bool.random(), "Random failure to simulate flakiness")
    }
}

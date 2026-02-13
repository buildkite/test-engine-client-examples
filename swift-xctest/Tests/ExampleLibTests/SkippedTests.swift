import XCTest

final class SkippedTests: XCTestCase {
    func testSkipped() throws {
        throw XCTSkip("Skipping this test to demonstrate skipped test functionality")
    }
}

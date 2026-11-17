import Core
import XCTest

class SplitTestCase: XCTestCase {
    override func setUpWithError() throws {
        // SwiftPM uses Module.Class filters, not Xcode's Target/Class spelling.
        var selector = String(reflecting: type(of: self))
        if ProcessInfo.processInfo.environment["TEST_SPLIT_BY"] == "method" {
            #if canImport(ObjectiveC)
            let method = name.split(separator: " ").last!.trimmingCharacters(in: CharacterSet(charactersIn: "]"))
            selector += "/\(method)"
            #else
            selector += "/\(name.split(separator: ".").last!)"
            #endif
        }
        tagExecution("test.selector.primary", selector)
        print("Execution selector: \(selector)")
    }
}

final class ArithmeticTests: SplitTestCase {
    func testAddition() { XCTAssertEqual(7 + 4, 11) }
    func testSubtraction() { XCTAssertEqual(7 - 4, 3) }
}

final class CollectionTests: SplitTestCase {
    func testSort() { XCTAssertEqual([3, 1, 2].sorted(), [1, 2, 3]) }
}

final class StringTests: SplitTestCase {
    func testUppercase() { XCTAssertEqual("Buildkite".uppercased(), "BUILDKITE") }
}

final class SlowTests: SplitTestCase {
    func testSlowOperation() {
        // A timing-aware plan should isolate this class instead of splitting 2/2.
        Thread.sleep(forTimeInterval: 30)
        XCTAssertEqual([1, 2, 3].reduce(0, +), 6)
    }
}

import PMKFoundation
import Foundation
import PromiseKit
import XCTest

class NSNotificationCenterTests: XCTestCase {
    func test() {
        let ex = expectation(description: "")
        let userInfo = ["a": 1]

        NotificationCenter.default.observe(once: PMKTestNotification).then { value -> Void in
            XCTAssertEqual(value.count, 1)
            //FIXME XCTAssert(value["a"] == (1 as Any?))
            ex.fulfill()
        }

        NotificationCenter.default.post(name: PMKTestNotification, object: nil, userInfo: userInfo)

        waitForExpectations(timeout: 1, handler: nil)
    }
}

private let PMKTestNotification = Notification.Name("PMKTestNotification")

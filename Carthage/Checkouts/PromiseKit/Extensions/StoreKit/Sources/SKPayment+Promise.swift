import StoreKit
#if !COCOAPODS
import PromiseKit
#endif

extension SKPayment {
    public func promise() -> Promise<SKPaymentTransaction> {
        return PaymentObserver(payment: self).promise
    }
}

fileprivate class PaymentObserver: NSObject, SKPaymentTransactionObserver {
    let (promise, fulfill, reject) = Promise<SKPaymentTransaction>.pending()
    let payment: SKPayment
    var retainCycle: PaymentObserver?
    
    init(payment: SKPayment) {
        self.payment = payment
        super.init()
        SKPaymentQueue.default().add(self)
        SKPaymentQueue.default().add(payment)
        retainCycle = self
    }
    
    func paymentQueue(_ queue: SKPaymentQueue, updatedTransactions transactions: [SKPaymentTransaction]) {
        guard let transaction = transactions.first(where: { $0.payment == payment }) else {
            return
        }
        switch transaction.transactionState {
        case .purchased:
            queue.finishTransaction(transaction)
            fulfill(transaction)
            queue.remove(self)
            retainCycle = nil
        case .failed:
            let error = transaction.error ?? NSError.cancelledError()
            queue.finishTransaction(transaction)
            reject(error)
            queue.remove(self)
            retainCycle = nil
        default:
            break
        }
    }
}

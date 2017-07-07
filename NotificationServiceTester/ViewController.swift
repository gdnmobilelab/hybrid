//
//  ViewController.swift
//  NotificationServiceTester
//
//  Created by alastair.coote on 15/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import UIKit
import UserNotifications
import ServiceWorker
import Just

class ViewController: UIViewController {
    
    static var textView:UIButton?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let text = UITextView(frame: CGRect(x:0,y:50,width:300,height:300))
        
        text.text = "Testing... "
        
        
//        self.view.addSubview(text)
        
        // Do any additional setup after loading the view, typically from a nib.
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge], completionHandler: { (result:Bool, err:Error?) in
            
            UIApplication.shared.registerForRemoteNotifications()
            
        })
        
        let button = UIButton(frame: CGRect(x: 0, y: 30, width: UIScreen.main.bounds.width, height: 30))
        button.setTitle("Test memory limit", for: UIControlState.normal)
//        button.backgroundColor = UIColor.red
        button.setTitleColor(UIColor.red, for: UIControlState.normal)
        button.tintColor = UIColor.red
        button.addTarget(self, action: #selector(startRemoteNotificationTest), for: .touchUpInside)
        self.view.addSubview(button)
        ViewController.textView = button
        
        
        let tbutton = UIButton(frame: CGRect(x: 0, y: 30, width: UIScreen.main.bounds.width, height: 90))
        tbutton.setTitle("Test notification thread ID", for: UIControlState.normal)
        //        button.backgroundColor = UIColor.red
        tbutton.setTitleColor(UIColor.red, for: UIControlState.normal)
        tbutton.tintColor = UIColor.red
        tbutton.addTarget(self, action: #selector(testThreadID), for: .touchUpInside)
        self.view.addSubview(tbutton)
        
        
    }
    
    @objc func testThreadID() {
        
        
        
        DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + 4) {
            
            let content = UNMutableNotificationContent()
            content.title = "Test notification"
            let hour = Calendar.current.component(.hour, from: Date())
            let minute = Calendar.current.component(.minute, from: Date())
            let second = Calendar.current.component(.second, from: Date())
            content.body = "Updated at \(hour):\(minute):\(second)"
            
            let center = UNUserNotificationCenter.current()
            
            center.getDeliveredNotifications(completionHandler: { (notifications) in
                let ids = notifications.map { $0.request.identifier }
//                center.removeDeliveredNotifications(withIdentifiers: [ids[2]])
                
                let req = UNNotificationRequest(identifier: ids[2], content: content, trigger: nil)
                center.add(req, withCompletionHandler: nil)
            })
            
            
            
        }
        
        
//        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge], completionHandler: { (result:Bool, err:Error?) in
//
//            let run = {
//                let subToken:[String:Any] = [
//                    "platform": "iOS",
//                    "device_id": AppDelegate.deviceToken,
//                    "bundle_name": "com.gdnmobilelabaccount.NotificationServiceTester",
//                    "sandbox": true
//                ]
//
//                Just.post("https://alastairtest-node.ngrok.io/registrations",
//                          json: ["subscription": subToken],
//                          headers: [
//                            "Authorization": "USER_KEY"
//                    ]
//                ) { r in
//                    let id = (r.json as AnyObject)["id"] as! String
//
//                    AppDelegate.firebaseToken = id
//
//                    AppDelegate.sendNotification(title: "Test notification", body: "Should be threaded.")
//                }
//            }
//
//            if AppDelegate.deviceToken != "" {
//                run()
//            } else {
//                AppDelegate.onDeviceToken = run
//            }
//
//            UIApplication.shared.registerForRemoteNotifications()
//        })
    }
    
    @objc func startRemoteNotificationTest() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge], completionHandler: { (result:Bool, err:Error?) in
            
            let run = {
                let subToken:[String:Any] = [
                    "platform": "iOS",
                    "device_id": AppDelegate.deviceToken,
                    "bundle_name": "com.gdnmobilelabaccount.NotificationServiceTester",
                    "sandbox": true
                ]
                
                Just.post("https://alastairtest-node.ngrok.io/registrations",
                          json: ["subscription": subToken],
                          headers: [
                            "Authorization": "USER_KEY"
                    ]
                ) { r in
                    let id = (r.json as AnyObject)["id"] as! String
                    
                    AppDelegate.firebaseToken = id
                    
                    AppDelegate.sendNotification(title: "FAILED", body: "1")
                }
            }
            
            if AppDelegate.deviceToken != "" {
                run()
            } else {
                AppDelegate.onDeviceToken = run
            }
            
            UIApplication.shared.registerForRemoteNotifications()
        })
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }


}


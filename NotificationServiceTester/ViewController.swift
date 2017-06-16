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

class ViewController: UIViewController {
    
    static var  textView:UITextView?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let text = UITextView(frame: CGRect(x:0,y:50,width:300,height:300))
        
        text.text = "Testing... " + String(describing:ServiceWorker.logInterface)
        
        ViewController.textView = text
        
        self.view.addSubview(text)
        
        // Do any additional setup after loading the view, typically from a nib.
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge], completionHandler: { (result:Bool, err:Error?) in
        
            UIApplication.shared.registerForRemoteNotifications()
            
        })
        
        
        
        
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }


}


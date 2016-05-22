//
//  ViewController.swift
//  hybrid
//
//  Created by Alastair Coote on 4/30/16.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import UIKit
import WebKit

class ViewController: UIViewController {
    
    var webv:WKWebView?;
    var webviewConfig:WKWebViewConfiguration;
    
    init(config: WKWebViewConfiguration) {
        webviewConfig = config;
        super.init(nibName: nil, bundle: nil);
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("ViewController must be init-ed with a WKWebViewConfiguration");
    }
    
   
   
    override func loadView() {
        
        webv = WKWebView(frame: UIScreen.mainScreen().bounds, configuration: self.webviewConfig);
        
        self.view = webv;
    }
    
    override func viewDidLoad() {
        
        webv!.loadRequest(NSURLRequest(URL: NSURL(string: "http://localhost:8000")!))
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }


}


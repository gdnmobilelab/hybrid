//
//  NotificationVideo.swift
//  hybrid
//
//  Created by alastair.coote on 04/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import AVKit
import AVFoundation
import JavaScriptCore

@objc protocol NotificationVideoExports : JSExport {
    var loop:Bool {get set}
    var autoplay:Bool {get set}
    var isPlaying:Bool {get}
    var isMuted:Bool {get}
    var duration:Double {get}
    var currentTime:Double {get set}
    var url:String {get}
    func play()
    func pause()
    func mute()
    func unmute()
}


@objc class NotificationVideo : NSObject, NotificationVideoExports {
    
    let playerController:AVPlayerViewController
    let extensionContext:NSExtensionContext?
    
    var loop:Bool = true
    var autoplay:Bool = true
    var muted:Bool = true
    
    var isPlaying:Bool = false
    
    var isMuted:Bool {
        get {
            return self.playerController.player!.volume == 0
        }
    }
    
    fileprivate var videoURL:URL
    
    var url:String {
        get {
            return self.videoURL.absoluteString
        }
    }
    
    var duration:Double {
        get {
            return CMTimeGetSeconds(self.playerController.player!.currentItem!.asset.duration)
        }
    }
    
    var currentTime:Double {
        get {
            return CMTimeGetSeconds(self.playerController.player!.currentItem!.currentTime())
        }
        set (value) {
            return self.playerController.player!.seek(to: CMTime(seconds: value, preferredTimescale: 1))
        }
    }
    
    init(videoURL:URL, options:AnyObject = [], context:NSExtensionContext?) {
        self.videoURL = videoURL
        self.playerController = AVPlayerViewController()
        self.playerController.player = AVPlayer(url: videoURL)
        self.playerController.showsPlaybackControls = false
        self.playerController.view.autoresizingMask = UIViewAutoresizing()
        self.extensionContext = context

        
        if let autoplay = options["autoplay"] as? Bool {
            self.autoplay = autoplay
        }
        
        if let loop = options["loop"] as? Bool {
            self.loop = loop
        }
        
        if let muted = options["muted"] as? Bool {
            self.muted = muted
        }
        
        
        if self.muted == true {
            self.playerController.player!.volume = 0
        }
        
        super.init()
        
        if self.autoplay == true {
            self.play()
        }
        
        log.info("Trying to play video at: " + videoURL.absoluteString!)
        
        NotificationCenter.default.addObserver(forName: NSNotification.Name.AVPlayerItemDidPlayToEndTime, object: nil, queue: nil, using: self.loopIfNeeded)
        
        self.playerController.player!.currentItem!.addObserver(self, forKeyPath: "status", options: [], context: nil)
    }
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
        
        let asItem = object as? AVPlayerItem
        
        if asItem == nil {
            return
        }
        
        let err = asItem!.error
        if let errExists = err {
            log.error("AV Fail:" + String(errExists))
        }
        
        
        
        
    }
    
    func loopIfNeeded(_ notification: Foundation.Notification) {
        if self.loop == true {
            self.playerController.player!.seek(to: kCMTimeZero)
            self.playerController.player!.play()
        } else {
            self.isPlaying = false
        }
    }
    
    func play() {
//        self.extensionContext?.mediaPlayingStarted()
        self.playerController.player!.play()
        self.isPlaying = true
    }
    
    func pause() {
//        self.extensionContext?.mediaPlayingPaused()
        self.playerController.player!.pause()
        self.isPlaying = false
    }
    
    func mute() {
        self.playerController.player!.volume = 0
    }
    
    func unmute() {
        self.playerController.player!.volume = 1
    }
    
}

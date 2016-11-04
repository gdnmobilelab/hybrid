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
    var url:String {get}
    func play()
    func pause()
    func mute()
    func unmute()
}


@objc class NotificationVideo : NSObject, NotificationVideoExports {
    
    let playerController:AVPlayerViewController
    
    var loop:Bool = true
    var autoplay:Bool = true
    var muted:Bool = true
    
    var isPlaying:Bool = false
    
    var isMuted:Bool {
        get {
            return self.playerController.player!.volume == 0
        }
    }
    
    private var videoURL:NSURL
    
    var url:String {
        get {
            return self.videoURL.absoluteString!
        }
    }
    
    init(videoURL:NSURL, options:AnyObject = []) {
        self.videoURL = videoURL
        self.playerController = AVPlayerViewController()
        self.playerController.player = AVPlayer(URL: videoURL)
        self.playerController.showsPlaybackControls = false

        
        if let autoplay = options["autoplay"] as? Bool {
            self.autoplay = autoplay
        }
        
        if let loop = options["loop"] as? Bool {
            self.loop = loop
        }
        
        if let muted = options["muted"] as? Bool {
            self.muted = muted
        }
        
        if self.autoplay == true {
            self.playerController.player!.play()
            self.isPlaying = true
        }
        
        if self.muted == true {
            self.playerController.player!.volume = 0
        }
        
        super.init()
        
        NSNotificationCenter.defaultCenter().addObserverForName(AVPlayerItemDidPlayToEndTimeNotification, object: nil, queue: nil, usingBlock: self.loopIfNeeded)
    }
    
    func loopIfNeeded(notification: NSNotification) {
        if self.loop == true {
            self.playerController.player!.seekToTime(kCMTimeZero)
            self.playerController.player!.play()
        } else {
            self.isPlaying = false
        }
    }
    
    func play() {
        self.playerController.player!.play()
        self.isPlaying = true
    }
    
    func pause() {
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

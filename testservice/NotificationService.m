//
//  NotificationService.m
//  testservice
//
//  Created by alastair.coote on 16/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

#import "NotificationService.h"
#import <JavaScriptCore/JavaScriptCore.h>
@import ServiceWorker;

@interface NotificationService ()


@end

@implementation NotificationService

- (void)didReceiveNotificationRequest:(UNNotificationRequest *)request withContentHandler:(void (^)(UNNotificationContent * _Nonnull))contentHandler {
    UNMutableNotificationContent *bestAttemptContent = [request.content mutableCopy];
    
    
    ServiceWorkerExecutionEnvironment *e = [[ServiceWorkerExecutionEnvironment alloc] init];
//    ServiceWorker *sw = [[ServiceWorker alloc] init];
    
//        JSContext *context = [JSContext new];
    JSContext *context = e.jsContext;
    
    NSString *jsFunctionText =
    @"var array = new Uint8Array(%@);"
    "for (var i = 0; i<array.length;i++) {"
    "    array[i] = 1;"
    "}; true";

    NSString *withSize = [NSString stringWithFormat:jsFunctionText,request.content.body];
    
    BOOL success = [[context evaluateScript:withSize] toBool];
    
    if (success) {
        bestAttemptContent.title = @"SUCCESS";
    }
    
    [e shutdown];
    
    contentHandler(bestAttemptContent);
//    [context release];
//    [jsFunctionText release];
//    [withSize release];
//    [request release];
//    [contentHandler release];
//    [bestAttemptContent release];
    
}

- (void)serviceExtensionTimeWillExpire {
    // Called just before the extension will be terminated by the system.
    // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
//    self.contentHandler(self.bestAttemptContent);
}

@end

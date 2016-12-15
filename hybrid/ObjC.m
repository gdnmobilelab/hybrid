/// -------------------------------------------
/// ObjC.m
/// -------------------------------------------
#import "ObjC.h"

@implementation ObjC

+ (BOOL)catchException:(void(^)())tryBlock error:(__autoreleasing NSError **)error {
    @try {
        tryBlock();
        return YES;
    }
    @catch (NSException *exception) {
        NSMutableDictionary * userInfo = [NSMutableDictionary dictionaryWithDictionary:exception.userInfo];
        [userInfo setValue:exception.reason forKey:NSLocalizedDescriptionKey];
        [userInfo setValue:exception.name forKey:NSUnderlyingErrorKey];
        
        *error = [[NSError alloc] initWithDomain:exception.name
                                            code:0
                                        userInfo:userInfo];
        return NO;
    }
}

@end

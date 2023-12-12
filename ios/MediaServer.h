
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNMediaServerSpec.h"

@interface MediaServer : NSObject <NativeMediaServerSpec>
#else
#import <React/RCTBridgeModule.h>

@interface MediaServer : NSObject <RCTBridgeModule>
#endif

@end

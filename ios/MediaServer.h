
#import "GCDWebServer.h"
#import "GCDWebServerFunctions.h"
#import "GCDWebServerFileResponse.h"
#import "GCDWebServerHTTPStatusCodes.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNMediaServerSpec.h"

@interface MediaServer : NSObject <NativeMediaServerSpec> {
    GCDWebServer* _webServer;
}
#else
#import <React/RCTBridgeModule.h>

@interface MediaServer : NSObject <RCTBridgeModule> {
    GCDWebServer* _webServer;
}
#endif

    @property(nonatomic, retain) NSString *localPath;
    @property(nonatomic, retain) NSString *url;

    @property (nonatomic, retain) NSString* www_root;
    @property (nonatomic, retain) NSNumber* port;
    @property (assign) BOOL localhost_only;
    @property (assign) BOOL keep_alive;

@end

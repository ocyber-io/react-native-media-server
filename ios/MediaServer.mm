#import "MediaServer.h"

@implementation MediaServer

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

- (instancetype)init {
    if((self = [super init])) {

        [GCDWebServer self];
        _webServer = [[GCDWebServer alloc] init];
    }
    return self;
}

- (void)dealloc {

    if(_webServer.isRunning == YES) {
        [_webServer stop];
    }
    _webServer = nil;

}

- (dispatch_queue_t)methodQueue
{
    return dispatch_queue_create("io.ocyber.mediaserver", DISPATCH_QUEUE_SERIAL);
}

+ (void)downloadFileFromURL: (NSURL *)fileURL pathToSave:(NSString *) pathToSave  byteRange:(NSRange) byteRange{
    NSLog(@"Downloading Started For File: %@", fileURL);
    dispatch_group_t group = dispatch_group_create();
    dispatch_group_enter(group);
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:fileURL];
    if(byteRange.location != NSNotFound){
        NSString *range = [
            NSString stringWithFormat:@"bytes=%lu-%lu",
           (unsigned long)byteRange.location,
           (unsigned long)(byteRange.location + byteRange.length - 1)
        ];
        [request setValue:range forHTTPHeaderField:@"Range"];
    }
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
    NSURLSession *session = [NSURLSession sessionWithConfiguration:configuration];
    NSURLSessionDataTask *downloadTask = [session dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        if (error) {
            NSLog(@"Error downloading file with byte range: %@", error);
            dispatch_group_leave(group);
            return;
        }
        
        // Handle the downloaded data here
        // For example, save it to a file
        [data writeToFile:pathToSave atomically:YES];
        
        NSLog(@"File downloaded successfully at path: %@", pathToSave);
        dispatch_group_leave(group);
    }];
    
    [downloadTask resume];
    dispatch_group_wait(group, DISPATCH_TIME_FOREVER);
}


+ (NSURL *)generateFileURL: (NSString *)baseURLString pathname:(NSString *) pathname {
    NSString *cleanedBaseURLString = [baseURLString stringByReplacingOccurrencesOfString:@"/$" withString:@"" options:NSRegularExpressionSearch range:NSMakeRange(0, [baseURLString length])];
    NSString *cleanedPathname = [pathname stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@"/"]];
    NSURL *baseURL = [NSURL URLWithString:cleanedBaseURLString];
    NSURL *completeURL = [baseURL URLByAppendingPathComponent:cleanedPathname];
    return completeURL;
}

+ (NSString *) getDirectoryPath: (NSString *) filePath {
    return [filePath stringByDeletingLastPathComponent];
}

+ (NSString *) getBaseURlFilePath: (NSString *) directoryPath {
    return [directoryPath stringByAppendingPathComponent:@"baseURL.txt"];
}

+ (NSString *) getBaseURIFromDirectory: (NSString *) directoryPath {
    NSString* bastURLFile = [self getBaseURlFilePath:directoryPath];
    NSString *baseURLString = [NSString stringWithContentsOfFile:bastURLFile encoding:NSUTF8StringEncoding error:nil];
    if (baseURLString) {
        NSString *trimmedBaseURL = [baseURLString stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
        return trimmedBaseURL;
    }
    return nil;
}

+ (void) addBaseURLFileToDirectory: (NSString *) directoryPath baseURL:(NSString *) baseURL {
    if(baseURL != nil){
        NSString* bastURLFile = [self getBaseURlFilePath:directoryPath];
        NSError *error = nil;
        NSData *data = [baseURL dataUsingEncoding:NSUTF8StringEncoding];
        BOOL success = [data writeToFile:bastURLFile options:NSDataWritingAtomic error:&error];
        if (success) {
            NSLog(@"Text written to file successfully at path: %@", bastURLFile);
        } else {
            NSLog(@"Error writing text to file: %@", error);
        }
    }
}

+ (void) createDirectoryIfNotExist: (NSString *) filePath {
    NSString * directoryPath = [self getDirectoryPath:filePath];
    NSFileManager *fileManager = [NSFileManager defaultManager];
    BOOL isDirectory;
    BOOL exists = [fileManager fileExistsAtPath:directoryPath isDirectory:&isDirectory];
    NSLog(@"isDirectory: %d, exists: %d", isDirectory, exists);
    if (!exists || !isDirectory) {
        NSError *error = nil;
        BOOL success = [fileManager createDirectoryAtPath:directoryPath withIntermediateDirectories:YES attributes:nil error:&error];
        
        if (!success) {
            NSLog(@"Error creating directory: %@", error);
            return;
        } else {
            NSLog(@"created directory: %@", directoryPath);
        }
    }
}

+ (NSString *) getOrCreateBaseURI: (NSString *) directoryPath baseURL:(NSString *) baseURL {
    [self addBaseURLFileToDirectory:directoryPath baseURL:baseURL];
    return [self getBaseURIFromDirectory:directoryPath];
}

+ (BOOL) fileExistsAtPath: (NSString *) filePath {
    NSFileManager *fileManager = [NSFileManager defaultManager];
    BOOL fileExists = [fileManager fileExistsAtPath:filePath];
    return fileExists;
}



RCT_EXPORT_METHOD(start: (NSString *)port
                  root:(NSString *)optroot
                  localOnly:(BOOL *)localhost_only
                  keepAlive:(BOOL *)keep_alive
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSString * root;

    if( [optroot isEqualToString:@"DocumentDir"] ){
        root = [NSString stringWithFormat:@"%@", [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) objectAtIndex:0] ];
    } else if( [optroot isEqualToString:@"BundleDir"] ){
        root = [NSString stringWithFormat:@"%@", [[NSBundle mainBundle] bundlePath] ];
    } else if([optroot hasPrefix:@"/"]) {
        root = optroot;
    } else {
        root = [NSString stringWithFormat:@"%@/%@", [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) objectAtIndex:0], optroot ];
    }


    if(root && [root length] > 0) {
        self.www_root = root;
    }

    if(port && [port length] > 0) {
        NSNumberFormatter *f = [[NSNumberFormatter alloc] init];
        f.numberStyle = NSNumberFormatterDecimalStyle;
        self.port = [f numberFromString:port];
    } else {
        self.port = [NSNumber numberWithInt:-1];
    }


    self.keep_alive = keep_alive;

    self.localhost_only = localhost_only;

    if(_webServer.isRunning != NO) {
        NSLog(@"MediaServer already running at %@", self.url);
        resolve(self.url);
        return;
    }

    //[_webServer addGETHandlerForBasePath:@"/" directoryPath:self.www_root indexFilename:@"index.html" cacheAge:3600 allowRangeRequests:YES];
    NSString *basePath = @"/";
    NSString *directoryPath = self.www_root;
    NSString *indexFilename = @"index.html";
    NSUInteger cacheAge = 0;
    BOOL allowRangeRequests = YES;
    [_webServer addHandlerWithMatchBlock:^GCDWebServerRequest*(NSString* requestMethod, NSURL* requestURL, NSDictionary<NSString*, NSString*>* requestHeaders, NSString* urlPath, NSDictionary<NSString*, NSString*>* urlQuery) {
        if (![requestMethod isEqualToString:@"GET"]) {
          return nil;
        }
        if (![urlPath hasPrefix:basePath]) {
          return nil;
        }
        return [[GCDWebServerRequest alloc] initWithMethod:requestMethod url:requestURL headers:requestHeaders path:urlPath query:urlQuery];
      }
      processBlock:^GCDWebServerResponse*(GCDWebServerRequest* request) {
        NSURL *fileURL = [NSURL fileURLWithPath:request.path];
        NSString *path = [[fileURL URLByDeletingLastPathComponent] path];
        NSString *filename = [fileURL lastPathComponent];
        
        
        
        GCDWebServerResponse* response = nil;
        
        NSString* filePath = [directoryPath stringByAppendingPathComponent:GCDWebServerNormalizePath([request.path substringFromIndex:basePath.length])];
        
        [MediaServer createDirectoryIfNotExist:filePath];
        NSString * mediaDirectoryPath = [MediaServer getDirectoryPath:filePath];
        NSString * baseURL = [MediaServer getOrCreateBaseURI:mediaDirectoryPath baseURL:request.query[@"baseURL"]];
        if(baseURL != nil) {
            NSURL * fileCloudURL = [MediaServer generateFileURL:baseURL pathname:request.path];
            BOOL exists = [MediaServer fileExistsAtPath:filePath];
            if(!exists){
                [MediaServer downloadFileFromURL:fileCloudURL pathToSave:filePath byteRange:request.byteRange];
            }
            NSLog(@"File Cloud URL: %@", fileCloudURL);
        }
        


        NSLog(@"File Path: %@", path);
        NSLog(@"File Name: %@", filename);
        
//        [MediaServer downloadFileFromURL:fileCloudURL pathToSave:filePath byteRange:request.byteRange];
        NSLog(@"File Path Generated %@", filePath);
        NSString* fileType = [[[NSFileManager defaultManager] attributesOfItemAtPath:filePath error:NULL] fileType];
        if (fileType) {
          if ([fileType isEqualToString:NSFileTypeDirectory]) {
            if (indexFilename) {
              NSString* indexPath = [filePath stringByAppendingPathComponent:indexFilename];
              NSString* indexType = [[[NSFileManager defaultManager] attributesOfItemAtPath:indexPath error:NULL] fileType];
              if ([indexType isEqualToString:NSFileTypeRegular]) {
                response = [GCDWebServerFileResponse responseWithFile:indexPath];
              }
            } else {
              response = [GCDWebServerResponse responseWithStatusCode:kGCDWebServerHTTPStatusCode_NotFound];
            }
          } else if ([fileType isEqualToString:NSFileTypeRegular]) {
            if (allowRangeRequests) {
              response = [GCDWebServerFileResponse responseWithFile:filePath byteRange:request.byteRange];
              [response setValue:@"bytes" forAdditionalHeader:@"Accept-Ranges"];
            } else {
              response = [GCDWebServerFileResponse responseWithFile:filePath];
            }
          }
        }
        if (response) {
          response.cacheControlMaxAge = cacheAge;
          [response setValue:@"GET" forAdditionalHeader:@"Access-Control-Request-Method"];
          [response setValue:@"OriginX-Requested-With, Content-Type, Accept, Cache-Control, Range,Access-Control-Allow-Origin"  forAdditionalHeader:@"Access-Control-Request-Headers"];
          [response setValue: @"*" forAdditionalHeader:@"Access-Control-Allow-Origin"];
        } else {
          response = [GCDWebServerResponse responseWithStatusCode:kGCDWebServerHTTPStatusCode_NotFound];
        }
        return response;
      }];

    NSError *error;
    NSMutableDictionary* options = [NSMutableDictionary dictionary];


    NSLog(@"Started MediaServer on port %@", self.port);

    if (![self.port isEqualToNumber:[NSNumber numberWithInt:-1]]) {
        [options setObject:self.port forKey:GCDWebServerOption_Port];
    } else {
        [options setObject:[NSNumber numberWithInteger:8080] forKey:GCDWebServerOption_Port];
    }

    if (self.localhost_only == YES) {
        [options setObject:@(YES) forKey:GCDWebServerOption_BindToLocalhost];
    }

    if (self.keep_alive == YES) {
        [options setObject:@(NO) forKey:GCDWebServerOption_AutomaticallySuspendInBackground];
        [options setObject:@2.0 forKey:GCDWebServerOption_ConnectedStateCoalescingInterval];
    }


    if([_webServer startWithOptions:options error:&error]) {
        NSNumber *listenPort = [NSNumber numberWithUnsignedInteger:_webServer.port];
        self.port = listenPort;

        if(_webServer.serverURL == NULL) {
            reject(@"server_error", @"MediaServer could not start", error);
        } else {
            self.url = [NSString stringWithFormat: @"%@://%@:%@", [_webServer.serverURL scheme], [_webServer.serverURL host], [_webServer.serverURL port]];
            NSLog(@"Started MediaServer at URL %@", self.url);
            resolve(self.url);
        }
    } else {
        NSLog(@"Error starting MediaServer: %@", error);

        reject(@"server_error", @"MediaServer could not start", error);

    }

}

RCT_EXPORT_METHOD(stop) {
    if(_webServer.isRunning == YES) {

        [_webServer stop];

        NSLog(@"MediaServer stopped");
    }
}

RCT_EXPORT_METHOD(origin:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    if(_webServer.isRunning == YES) {
        resolve(self.url);
    } else {
        resolve(@"");
    }
}

RCT_EXPORT_METHOD(isRunning:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    bool isRunning = _webServer != nil &&_webServer.isRunning == YES;
    resolve(@(isRunning));
}

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}


@end

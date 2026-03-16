#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AppGroupModule, NSObject)
RCT_EXTERN_METHOD(writeString:(NSString *)key value:(NSString *)value)
RCT_EXTERN_METHOD(reloadWidget)
@end

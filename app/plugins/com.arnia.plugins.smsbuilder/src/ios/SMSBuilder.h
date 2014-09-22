#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>

#import <MessageUI/MessageUI.h>
#import <MessageUI/MFMessageComposeViewController.h>

@interface SMSBuilder : CDVPlugin <MFMessageComposeViewControllerDelegate> {
}

- (void)showSMSBuilder:(NSArray*)arguments withDict:(NSDictionary*)options;
@end

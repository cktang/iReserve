/**
 * SMS Builder plugin for PhoneGap
 * window.plugins.SMSBuilder
 *
 * @constructor
 */
function SMSBuilder()
{
	this.resultCallback = null;
}

SMSBuilder.BuildResultType =
{
    Cancelled:0,
    Sent:1,
    Failed:2,
    NotSent:3
}

SMSBuilder.prototype.showSMSBuilder = function(toRecipients, body)
{
	var args = {};
    
	if(toRecipients)
		args.toRecipients = toRecipients;
    
	if(body)
		args.body = body;
    
	cordova.exec(null, null, "SMSBuilder", "showSMSBuilder", [args]);
}

SMSBuilder.prototype.showSMSBuilderWithCB = function(cbFunction,toRecipients,body)
{
	this.resultCallback = cbFunction;
	this.showSMSBuilder.apply(this,[toRecipients,body]);
}

SMSBuilder.prototype._didFinishWithResult = function(res)
{
	this.resultCallback(res);
}

cordova.addConstructor(function() {
                        
    if(!window.plugins)	{
        window.plugins = {};
    }
	
	if (!window.Cordova) {
		window.Cordova = cordova;
	}
	
    window.plugins.smsBuilder = new SMSBuilder();
});
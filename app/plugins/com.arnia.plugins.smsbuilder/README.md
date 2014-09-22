# PhoneGap SMSBuilder Plugin #

SMSBuilder is a Phonegap Build compatible plugin for sending SMS on iOS.

## Example usage ##

* All parameters are optional.
	`window.plugins.smsBuilder.showSMSBuilder();`


* Passing phone number and message.
	`window.plugins.smsBuilder.showSMSBuilder('3424221122', 'hello');`

* Multiple recipents are separated by comma(s).
	`window.plugins.smsBuilder.showSMSBuilder('3424221122,2134463330', 'hello');`


* `showSMSBuilderWithCB` takes a callback as its first parameter.  
* 0, 1, 2, or 3 will be passed to the callback when the text message has been attempted.

```javascript
	window.plugins.smsBuilder.showSMSBuilderWithCB(function(result){

		if(result == 0)
			alert("Cancelled");
		else if(result == 1)
			alert("Sent");
		else if(result == 2)
			alert("Failed.");
		else if(result == 3)
			alert("Not Sent.");		

	},'3424221122,2134463330', 'hello');
````````

#### Known bug #####

It seems that the code isn't executed in Phonegap Build :( 
Until we manage to fix this issue, you can use the plugin by calling it directly using `cordova.exec`:
```javascript
cordova.exec(null, null, "SMSBuilder", "showSMSBuilder", [{"toRecipients": "3424221122,2134463330", "body": "hello"}]);
```
instead of
```javascript
window.plugins.smsBuilder.showSMSBuilder('3424221122,2134463330', "hello");
```

## Special thanks ##

We would like to say thanks to Grant Sanders (https://github.com/phonegap/phonegap-plugins/blob/master/iPhone/SMSComposer/) for inspiration, for the code we have (re)used and for doing such a great job for the open-source community!

## License ##

[The MIT License (MIT)](http://www.opensource.org/licenses/mit-license.html)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

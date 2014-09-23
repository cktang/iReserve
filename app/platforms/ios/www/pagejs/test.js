var socket;

var App = App || {};
var sent = false;



  window.onerror = function(a,b,c) {
    alert(a + "; " + b + "; " + c);
  }

document.addEventListener("deviceready", function() {
	console.log('device ready');

	setTimeout(function() {
		try {
			console.log("CORDOVA: " + cordova);
			console.log("WP: " + window.plugins);
			console.log("SHARE: " + window.plugins.socialsharing.shareViaSMS);
			
			console.log("A: " + window.plugins.socialsharing.available);
			window.plugins.socialsharing.available(function(isAvailable) {
				console.log("isAvailable: " + isAvailable);
			}); 

			window.plugins.socialsharing.shareViaSMS(
				'My cool message', '97213779,96269978', 
				function(msg) {console.log('ok: ' + msg)}, 
				function(msg) {alert('error: ' + msg)}
			);

			window.plugins.socialsharing.shareViaFacebookWithPasteMessageHint('Message via Facebook', null /* img */, null /* url */, 'Paste it dude!', function() {console.log('share ok')}, function(errormsg){alert(errormsg)});

			console.log('done');
		}catch(e) { console.log("Error: " + e); }
	}, 5000);

	socket = new App.Websocket({
		ip: "10.0.1.17",
		port: 1234
	});

	// socket.connect();

	socket.msgCallback = function(data) {
		if (data.type == 'log') {
			$('#status').html(data.payload);
		}

		if (data.type == 'captcha') {
			$('#captchaImage').attr('src', data.payload);
		}

		if (data.type == 'sms') {
			$('[name=smsText]').val(data.payload);
			if (!sent) {
				console.log('sending: ' + data.payload);
				sent = true;
				try {
					console.log("OBJ: " + exec); 
					//window.plugins.smsBuilder.showSMSBuilder('97213779', 'hello');
					//cordova.exec(null, null, "SMSBuilder", "showSMSBuilder", [{"toRecipients": "97213779", "body": "hello"}]);
				} catch(e) {
					console.log("Error: " + e);
				}
			}
		}
	}

	$('[name=captchaText]').select();


});